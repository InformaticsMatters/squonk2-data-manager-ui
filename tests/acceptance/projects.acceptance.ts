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
  await expect(factRow(page, "Administrators")).toContainText(subject);
  await expect(factRow(page, "Observers")).toContainText(`${subject}-observer`);

  for (const label of ["Change privacy", "Change administrators", "Change files", "Run work"]) {
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

  await expect(
    page.getByText("You must be a project administrator to change project privacy."),
  ).toBeVisible();
  await expect(
    page.getByText("You must be a project administrator to change project administrators."),
  ).toBeVisible();
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
  await expect(factRow(page, "Change privacy")).toContainText(
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
  await expect(factRow(page, "Change privacy")).toContainText("Available to you.");
});
