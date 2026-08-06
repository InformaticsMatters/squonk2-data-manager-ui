import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { RECENT_PROJECTS_STORAGE_KEY } from "../../src/projects/recentProjects";
import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}`);
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.1.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

test("Project index searches the current organisation and explicitly enters Files", async ({
  page,
  request,
}, testInfo) => {
  await login(page, "projects", testInfo);

  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByText("Partner Project", { exact: true })).not.toBeVisible();
  await page.getByLabel("Search projects").fill("Shared");
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects?search=Shared`);
  await expect(page.getByText("Shared Project", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Acceptance Unit", { exact: false })).toBeVisible();
  await expect(page.getByText("Screening Unit", { exact: false })).toBeVisible();

  await page.getByLabel("Search projects").fill("");
  await page.getByRole("link", { name: /Acceptance Project/u }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/files`);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}`)
    .then((response) => response.json() as Promise<{ requests: { path: string }[] }>);
  expect(diagnostics.requests.map(({ path }) => path)).toEqual(
    expect.arrayContaining([`/project/${fixtureIds.project}`, `/product/${fixtureIds.product}`]),
  );
});

test("Project 403 and 404 share a non-disclosing result and clear recent content", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const projectPath = `projects/${fixtureIds.project}/files`;
  await login(page, projectPath, testInfo);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .toContain(fixtureIds.project);

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/project-failure?status=403`);
  await page.reload();
  await expect(
    page.getByText("This project is unavailable or you no longer have access."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Files" })).not.toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .not.toContain(fixtureIds.project);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-failure`);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .toContain(fixtureIds.project);

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/project-failure?status=404`);
  await page.reload();
  await expect(
    page.getByText("This project is unavailable or you no longer have access."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Files" })).not.toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .not.toContain(fixtureIds.project);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${projectPath}`);
});

test("transient Project failure retains chrome and retries without changing scope", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const projectPath = `projects/${fixtureIds.project}/files`;
  await login(page, projectPath, testInfo);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await page.getByRole("link", { name: "Squonk Home" }).click();
  await expect(page).toHaveURL(acceptanceUrls.app.slice(0, -1));
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/project-failure?status=503`);
  await page.goBack();

  await expect(
    page.getByText("Project data could not be loaded. Retry this project."),
  ).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${projectPath}`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${projectPath}`);
});

const managePath = `projects/${fixtureIds.project}/manage`;

/** Manage renders each fact as one list item whose text begins with that fact's label. */
const factRow = (page: Page, label: string) =>
  page.getByRole("listitem").filter({ hasText: new RegExp(`^${label}`, "u") });

/** Each project change Manage owns is one labelled region containing its control and its answer. */
const members = (page: Page, role: string) => page.getByRole("region", { name: role });
const privacyControl = (page: Page) => page.getByRole("region", { name: "Privacy" });
const privacySwitch = (page: Page) => privacyControl(page).getByRole("switch", { name: "Private" });

/** One member of a list, as the chip the control shows for them. */
const memberChip = (page: Page, role: string, username: string) =>
  members(page, role).getByRole("button", { name: username, exact: true });

const addMember = async (page: Page, role: string, username: string) => {
  await members(page, role).getByRole("combobox").click();
  await page.getByRole("option", { name: username, exact: true }).click();
};

/** The other way a name reaches a list: typed and committed, without choosing a listed option. */
const typeMember = async (page: Page, role: string, text: string) => {
  const combobox = members(page, role).getByRole("combobox");
  await combobox.click();
  await combobox.fill(text);
  await combobox.press("Enter");
};

/**
 * Holds the addressed project's next privacy change until the returned release is called, so a
 * command that has been sent and not yet answered is an observable state rather than a race. This
 * is the one fixture behaviour a scenario cannot carry: what is under test is how long the browser
 * waits, which only the browser's own view of the request can decide. Releasing also stops holding,
 * so a scenario the test moves on to is answered normally.
 */
const holdPrivacyChange = async (page: Page) => {
  const projectUrl = `${acceptanceUrls.dataManager}/project/${fixtureIds.project}`;
  const held = Promise.withResolvers<undefined>();
  await page.route(projectUrl, async (route) => {
    if (route.request().method() === "PATCH") {
      await held.promise;
    }
    await route.continue();
  });
  return async () => {
    held.resolve(undefined);
    await page.unroute(projectUrl);
  };
};

test("Manage presents project facts and available actions to a project administrator", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, managePath, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Acceptance Project" })).toBeVisible();
  await expect(page.getByText("Private", { exact: true }).first()).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Private");
  await expect(page.getByText("You have read-only access to this project.")).toHaveCount(0);

  await expect(factRow(page, "Your access")).toContainText("Administrator, Creator, Editor");
  await expect(factRow(page, "Containing unit")).toContainText("Acceptance Unit");
  await expect(factRow(page, "Owning organisation")).toContainText("Acceptance Organisation");
  await expect(memberChip(page, "Administrators", subject)).toBeVisible();
  await expect(memberChip(page, "Observers", `${subject}-observer`)).toBeVisible();

  // Manage owns these changes, so an administrator is offered the controls themselves.
  await expect(privacySwitch(page)).toBeEnabled();
  for (const role of ["Administrators", "Editors", "Observers"]) {
    await expect(members(page, role).getByRole("combobox")).toBeEnabled();
  }
  for (const label of ["Change files", "Run work"]) {
    await expect(factRow(page, label)).toContainText("Available to you.");
  }

  await expect(factRow(page, "Tier")).toContainText("Bronze");
  await expect(factRow(page, "Coin allowance")).toContainText("100");
  // Only a subscription that accounts for instances can be run against, so it says that it does.
  await expect(factRow(page, "Instance coins used")).toContainText("0");
  // Support owns every diagnostic identifier, so each is stated exactly once.
  await expect(factRow(page, "Project ID")).toContainText(fixtureIds.project);
  await expect(factRow(page, "Subscription ID")).toContainText(fixtureIds.product);
  await expect(factRow(page, "Unit ID")).toContainText(fixtureIds.unit);
  await expect(factRow(page, "Organisation ID")).toContainText(fixtureIds.organisation);
  await expect(page.getByRole("link", { name: "View subscription" })).toHaveAttribute(
    "href",
    `/data-manager-ui/administration/subscriptions/${fixtureIds.product}`,
  );

  // The one exclusively platform-administrator action is absent, not merely unavailable.
  await expect(page.getByRole("button", { name: "Take project administration" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Platform administration" })).toHaveCount(0);
});

test("Manage stays available to a project viewer and explains every unavailable action", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, managePath, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(factRow(page, "Your access")).toContainText("Observer");
  await expect(page.getByText("You have read-only access to this project.")).toBeVisible();

  // An ordinary unavailable control stays visible and disabled, with the reason beside it.
  await expect(privacySwitch(page)).toBeDisabled();
  await expect(
    privacyControl(page).getByText(
      "You must be a project administrator to change project privacy.",
    ),
  ).toBeVisible();
  for (const [role, requirement] of [
    ["Administrators", "administrators"],
    ["Editors", "editors"],
    ["Observers", "observers"],
  ]) {
    await expect(members(page, role).getByRole("combobox")).toBeDisabled();
    await expect(
      members(page, role).getByText(
        `You must be a project administrator to change project ${requirement}.`,
      ),
    ).toBeVisible();
  }
  // A viewer still reads the memberships they cannot change.
  await expect(memberChip(page, "Observers", subjectFor(testInfo))).toBeVisible();
  await expect(
    page.getByText("You must be a project administrator to delete this project."),
  ).toBeVisible();
  await expect(
    page.getByText("You must be a project editor or administrator to change project files."),
  ).toBeVisible();
  await expect(
    page.getByText("You must be a project editor or administrator to run work in this project."),
  ).toBeVisible();
  // Readable facts remain useful even though nothing here can be changed.
  await expect(factRow(page, "Tier")).toContainText("Bronze");
  await expect(page.getByRole("button", { name: "Take project administration" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Platform administration" })).toHaveCount(0);
});

test("the platform-administrator action is offered alone and its rejection changes nothing", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.put(`${acceptanceUrls.control}/scenario/${subject}?profile=platform-admin`);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure?status=403`,
  );
  await login(page, managePath, testInfo);

  const takeAdministration = page.getByRole("button", { name: "Take project administration" });
  await expect(takeAdministration).toBeEnabled();
  await expect(factRow(page, "Your access")).toContainText("No project role");
  // The realm role offers its own action alone; it is not ordinary authority over the project.
  await expect(page.getByText("You have read-only access to this project.")).toBeVisible();
  await expect(privacySwitch(page)).toBeDisabled();
  await expect(privacyControl(page)).toContainText(
    "You must be a project administrator to change project privacy.",
  );

  await takeAdministration.click();
  await expect(
    page.getByText(
      `You cannot take administration of project ${fixtureIds.project}. It is unavailable or you do not have access. The displayed project has not changed.`,
    ),
  ).toBeVisible();
  // An authoritative rejection is feedback, never navigation or a change of scope.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await expect(page.getByRole("heading", { level: 2, name: "Acceptance Project" })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(factRow(page, "Your access")).toContainText("No project role");

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure`);
  await takeAdministration.click();
  await expect(page.getByText("You now administer this project.")).toBeVisible();
  await expect(factRow(page, "Your access")).toContainText("Administrator");
  await expect(page.getByText("You already administer this project.")).toBeVisible();
  // Ordinary authority arrives with the membership the server granted, not with the realm role.
  await expect(page.getByText("You have read-only access to this project.")).toHaveCount(0);
  await expect(privacySwitch(page)).toBeEnabled();
});

test("Manage owns project privacy and every project role change", async ({ page }, testInfo) => {
  const subject = subjectFor(testInfo);
  const colleague = `${subject}-observer`;
  await login(page, managePath, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();

  // Privacy. The project's own state answers, and the change is stated where it was made.
  await expect(privacySwitch(page)).toBeChecked();
  await privacySwitch(page).click();
  await expect(privacyControl(page).getByText("This project is now public.")).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Public");
  await expect(page.getByText("Public", { exact: true }).first()).toBeVisible();

  await privacySwitch(page).click();
  await expect(privacyControl(page).getByText("This project is now private.")).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Private");

  // Each membership list is changed here and nowhere else.
  await addMember(page, "Administrators", colleague);
  await expect(
    members(page, "Administrators").getByText(
      `${colleague} is now an administrator of this project.`,
    ),
  ).toBeVisible();
  await expect(memberChip(page, "Administrators", colleague)).toBeVisible();

  await addMember(page, "Editors", colleague);
  await expect(
    members(page, "Editors").getByText(`${colleague} is now an editor of this project.`),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", colleague)).toBeVisible();

  await members(page, "Observers").getByLabel(`Remove ${colleague}`).click();
  await expect(
    members(page, "Observers").getByText(`${colleague} is no longer an observer of this project.`),
  ).toBeVisible();
  await expect(memberChip(page, "Observers", colleague)).toHaveCount(0);

  // The refreshed project is what is displayed, and the URL never moved.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await page.reload();
  await expect(memberChip(page, "Administrators", colleague)).toBeVisible();
  await expect(memberChip(page, "Editors", colleague)).toBeVisible();
  await expect(memberChip(page, "Observers", colleague)).toHaveCount(0);
  await expect(factRow(page, "Privacy")).toContainText("Private");
});

test("a typed member name is a command, and one that names nobody says so", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  // Someone the directory does not list, so the name can only have arrived by being typed.
  const newcomer = `${subject}-newcomer`;
  await login(page, managePath, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();

  await typeMember(page, "Editors", newcomer);
  await expect(
    members(page, "Editors").getByText(`${newcomer} is now an editor of this project.`),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", newcomer)).toBeVisible();

  // A name that spells no user is declined where it was typed rather than silently dropped.
  await typeMember(page, "Editors", "   ");
  await expect(
    members(page, "Editors").getByText("Enter a username to add as an editor."),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", newcomer)).toHaveCount(1);

  await page.reload();
  await expect(memberChip(page, "Editors", newcomer)).toBeVisible();
});

test("a sent privacy change states what it is applying until the server answers", async ({
  page,
}, testInfo) => {
  await login(page, managePath, testInfo);
  await expect(privacySwitch(page)).toBeChecked();

  const release = await holdPrivacyChange(page);
  await privacySwitch(page).click();
  // The control shows the privacy it is applying, so a sent change never reads as one that was
  // refused, and it cannot be sent twice while the first is unanswered.
  await expect(privacySwitch(page)).not.toBeChecked();
  await expect(privacySwitch(page)).toBeDisabled();
  await expect(factRow(page, "Privacy")).toContainText("Private");

  await release();
  await expect(privacyControl(page).getByText("This project is now public.")).toBeVisible();
  await expect(privacySwitch(page)).not.toBeChecked();
  await expect(privacySwitch(page)).toBeEnabled();
  await expect(factRow(page, "Privacy")).toContainText("Public");
});

test("a rejected project change is feedback alone, and restored access succeeds", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const colleague = `${subject}-observer`;
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure?status=403`,
  );
  await login(page, managePath, testInfo);
  await expect(privacySwitch(page)).toBeEnabled();

  await privacySwitch(page).click();
  await expect(
    privacyControl(page).getByText(
      `You cannot change the privacy of project ${fixtureIds.project}. It is unavailable or you do not have access. The displayed project has not changed.`,
    ),
  ).toBeVisible();
  // A refusal changes neither the displayed project, nor its organisation, nor the route.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Private");
  await expect(privacySwitch(page)).toBeChecked();

  await addMember(page, "Editors", colleague);
  await expect(
    members(page, "Editors").getByText(
      `You cannot change the editors of project ${fixtureIds.project}. It is unavailable or you do not have access. The displayed project has not changed.`,
    ),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", colleague)).toHaveCount(0);

  // Restored access needs no reload: the same control is still the next step.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure`);
  await addMember(page, "Editors", colleague);
  await expect(
    members(page, "Editors").getByText(`${colleague} is now an editor of this project.`),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", colleague)).toBeVisible();
});

test("unconfirmed project facts leave changes available and defer to the server", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/caller-account-failure`);
  await login(page, managePath, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();

  // Facts that cannot establish the caller never claim authority, and never claim its absence.
  await expect(factRow(page, "Your access")).toContainText("No project role");
  await expect(page.getByText("You have read-only access to this project.")).toHaveCount(0);
  await expect(privacySwitch(page)).toBeEnabled();
  await expect(privacyControl(page)).toContainText(
    "You must be a project administrator to change project privacy. Your permission will be confirmed when you use this action.",
  );

  // A transport failure states that nothing changed and leaves the control usable.
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure?status=503`,
  );
  await privacySwitch(page).click();
  await expect(
    privacyControl(page).getByText(
      `Could not change the privacy of project ${fixtureIds.project}. The displayed project has not changed; retry is available.`,
    ),
  ).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Private");
  await expect(privacySwitch(page)).toBeChecked();

  // Once the caller and the server both answer, the same control completes the change.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure`);
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/caller-account-failure`);
  await page.reload();
  await expect(factRow(page, "Your access")).toContainText("Administrator, Creator, Editor");
  await privacySwitch(page).click();
  await expect(privacyControl(page).getByText("This project is now public.")).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Public");
});
