import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const acceptanceRun = `projects/${fixtureIds.project}/run`;
const screeningRun = `projects/${fixtureIds.screeningProject}/run`;
const acceptanceResults = `projects/${fixtureIds.project}/results`;

type Diagnostics = { requests: { method: string; path: string; query: string }[] };

const catalogueReads = async (
  request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> },
  subject: string,
) => {
  const diagnostics = (await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json())) as Diagnostics;
  return diagnostics.requests.filter(({ path }) =>
    ["/application", "/job", "/workflow", "/instance", "/running-workflow"].includes(path),
  );
};

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}`);
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.7.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

test("the Run catalogue belongs to the project in the URL", async ({ page, request }, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceRun, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}`);
  await expect(page.getByRole("heading", { level: 1, name: "Run" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();

  // All three definition types are offered, each one card headed by its own definition.
  await expect(page.getByText("Acceptance Workflow Definition")).toBeVisible();
  await expect(page.getByText("AcceptanceNotebook")).toBeVisible();
  await expect(page.getByText("acceptance-job", { exact: true })).toBeVisible();
  await expect(page.getByText("unavailable-job", { exact: true })).toBeVisible();

  // A card offers its definition's own canonical route, so every definition is directly shareable.
  await expect(
    page.getByRole("link", { name: "Run Acceptance Workflow Definition" }),
  ).toHaveAttribute("href", `/data-manager-ui/${acceptanceRun}/workflows/${fixtureIds.workflow}`);
  await expect(page.getByRole("link", { name: "Run AcceptanceNotebook" })).toHaveAttribute(
    "href",
    `/data-manager-ui/${acceptanceRun}/applications/acceptance-application`,
  );
  // A job card is headed by its newest version and addresses that version's own route.
  await expect(page.getByRole("link", { name: "Run acceptance-job" })).toHaveAttribute(
    "href",
    `/data-manager-ui/${acceptanceRun}/jobs/2`,
  );

  // Every catalogue read the Data Manager scopes by project named the URL project, and the ones it
  // does not scope were never given a guessed one.
  const reads = await catalogueReads(request, subject);
  const scoped = reads.filter(({ path }) =>
    ["/job", "/instance", "/running-workflow"].includes(path),
  );
  expect(scoped.length).toBeGreaterThanOrEqual(3);
  for (const read of scoped) {
    expect(read.query).toContain(`project_id=${fixtureIds.project}`);
  }
  for (const read of reads.filter(({ path }) => ["/application", "/workflow"].includes(path))) {
    expect(read.query).not.toContain("project_id");
  }

  // A second project reads its own catalogue rather than inheriting the first project's.
  await page.goto(screeningRun);
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  const afterSecond = await catalogueReads(request, subject);
  const jobReads = afterSecond.filter(({ path }) => path === "/job");
  expect(
    jobReads.some(({ query }) => query.includes(`project_id=${fixtureIds.screeningProject}`)),
  ).toBe(true);
  expect(jobReads.filter(({ query }) => !query.includes("project_id="))).toEqual([]);
});

test("a definition opens as a route-driven modal that Close and Back both resolve", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceRun, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Run" })).toBeVisible();

  // Opening a definition pushes history and is directly linkable.
  await page.getByRole("link", { name: "Run Acceptance Workflow Definition" }).click();
  const workflowDefinition = `${acceptanceRun}/workflows/${fixtureIds.workflow}`;
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDefinition}`);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("Screens a library against a target"),
  ).toBeVisible();
  // The catalogue is still beneath the definition it was opened over.
  await expect(page.getByText("AcceptanceNotebook")).toBeVisible();

  // Back restores the catalogue exactly.
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}`);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Explicit Close replaces the definition with the catalogue, so Back does not reopen it.
  await page.getByRole("link", { name: "Run Acceptance Workflow Definition" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDefinition}`);
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}`);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Forward returns to the catalogue the Close left, never to a reopened definition.
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}`);
});

test("every definition type is directly linkable and keeps the catalogue state it carries", async ({
  page,
}, testInfo) => {
  await login(page, `${acceptanceRun}?search=docking&type=job&unknown=leaked`, testInfo);

  // An unknown key never survives, so it can never reach a generated request argument.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}?search=docking&type=job`);
  await expect(page.getByText("acceptance-job", { exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Workflow Definition")).toHaveCount(0);
  await expect(page.getByText("AcceptanceNotebook")).toHaveCount(0);

  // The definition link preserves the catalogue state it was opened from.
  await page.getByRole("link", { name: "Run acceptance-job" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceRun}/jobs/2?search=docking&type=job`,
  );
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}?search=docking&type=job`);
  await expect(page.getByLabel(/Search/u)).toHaveValue("docking");

  // Each definition type answers at its own direct link.
  for (const [href, heading] of [
    [`${acceptanceRun}/applications/acceptance-application`, "AcceptanceNotebook"],
    [`${acceptanceRun}/jobs/1`, "Acceptance Job"],
    [`${acceptanceRun}/workflows/${fixtureIds.workflow}`, "Acceptance Workflow Definition"],
  ] as const) {
    await page.goto(href);
    await expect(page).toHaveURL(`${acceptanceUrls.app}${href}`);
    await expect(page.getByRole("dialog").getByText(heading).first()).toBeVisible();
    await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  }

  // Another section of the same project starts from its own state, never from Run's.
  await page.goto(`${acceptanceRun}?search=docking`);
  await page.getByRole("link", { name: "Results", exact: true }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
});

test("a malformed definition route is Run-local and never guessed at", async ({
  page,
}, testInfo) => {
  const malformed = `${acceptanceRun}/jobs/not-a-number`;
  await login(page, malformed, testInfo);

  // The URL is not corrected, the project stays exactly where it was, and the catalogue remains.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${malformed}`);
  await expect(page.getByText("This definition was not found in this project.")).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Run" })).toBeVisible();
  await expect(page.getByText("acceptance-job", { exact: true })).toBeVisible();

  // A well-formed identity the project's catalogue does not offer answers identically.
  const absent = `${acceptanceRun}/jobs/404`;
  await page.goto(absent);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${absent}`);
  await expect(page.getByText("This definition was not found in this project.")).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  // A URL beneath Run that is not shaped like a definition route at all is still Run's to answer,
  // so a mistyped path never costs the project frame it was addressed beneath.
  for (const misshapen of [`${acceptanceRun}/jobs`, `${acceptanceRun}/jobs/1/versions/1`]) {
    await page.goto(misshapen);
    await expect(page).toHaveURL(`${acceptanceUrls.app}${misshapen}`);
    await expect(page.getByText("This definition was not found in this project.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Run" })).toBeVisible();
    await expect(page.getByText("acceptance-job", { exact: true })).toBeVisible();
  }
});

test("searching narrows the catalogue and settles into the route that owns it", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceRun, testInfo);
  await expect(page.getByText("AcceptanceNotebook")).toBeVisible();

  // The shortcut reaches the field without the caller having to find it.
  await page.keyboard.press(process.platform === "darwin" ? "Meta+f" : "Control+f");
  await expect(page.getByLabel(/Search/u)).toBeFocused();

  // Typed one character at a time, the field keeps every keystroke and the route is written only
  // once typing settles — never once per character, and never rolled back to a half-typed value.
  const search = page.getByLabel(/Search/u);
  await search.pressSequentially("docking", { delay: 40 });
  await expect(search).toHaveValue("docking");
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}?search=docking`);
  await expect(page.getByText("acceptance-job", { exact: true })).toBeVisible();
  await expect(page.getByText("AcceptanceNotebook")).toHaveCount(0);

  // Typing on past a value the route has just taken keeps what was typed rather than the route's
  // older answer, so a settled write can never undo the keystrokes that followed it.
  await search.pressSequentially("-run", { delay: 40 });
  await expect(search).toHaveValue("docking-run");
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}?search=docking-run`);

  // Clearing it returns the catalogue and leaves no state behind on the route.
  await search.fill("");
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}`);
  await expect(page.getByText("AcceptanceNotebook")).toBeVisible();
});

test("launching opens the execution it created inside the project that ran it", async ({
  page,
}, testInfo) => {
  await login(page, `${acceptanceRun}/jobs/1`, testInfo);
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("button", { name: "Run", exact: true }).click();
  const instanceResult = `${acceptanceResults}/instances/${fixtureIds.launchedInstance}`;
  await expect(page).toHaveURL(`${acceptanceUrls.app}${instanceResult}`);
  await expect(
    page.getByRole("banner").getByText("Acceptance Project", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();

  // A workflow launch opens the running workflow it created, under the same project.
  await page.goto(`${acceptanceRun}/workflows/${fixtureIds.workflow}`);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/workflows/${fixtureIds.launchedRunningWorkflow}`,
  );
  await expect(
    page.getByRole("banner").getByText("Acceptance Project", { exact: true }),
  ).toBeVisible();
});

test("a rejected launch keeps the definition open rather than reporting work that never ran", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/launch-failure?status=503`);
  await login(page, `${acceptanceRun}/jobs/1`, testInfo);
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("button", { name: "Run", exact: true }).click();
  // The route, the definition, and everything entered survive the rejection.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}/jobs/1`);
  await expect(page.getByRole("dialog")).toBeVisible();

  // Retrying in place succeeds and opens the execution that was finally created.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/launch-failure`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.launchedInstance}`,
  );
});

test("a project observer browses the catalogue and is told what launching requires", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, acceptanceRun, testInfo);

  await expect(page.getByRole("heading", { level: 1, name: "Run" })).toBeVisible();
  // Reading the project's catalogue is not withheld along with the launch.
  await expect(page.getByText("Acceptance Workflow Definition")).toBeVisible();
  await expect(page.getByText("acceptance-job", { exact: true })).toBeVisible();
  await expect(
    page
      .getByText("You must be a project editor or administrator to run work in this project.")
      .first(),
  ).toBeVisible();

  // Opening a definition is reading, so it stays available; only running it is withheld.
  await page.goto(`${acceptanceRun}/jobs/1`);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  await expect(
    page
      .getByRole("dialog")
      .getByText("You must be a project editor or administrator to run work in this project."),
  ).toBeVisible();
});

test("a definition the Data Manager disabled explains itself and cannot be run", async ({
  page,
}, testInfo) => {
  await login(page, `${acceptanceRun}/jobs/3`, testInfo);

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  await expect(
    page.getByRole("dialog").getByText("This job's container image is missing."),
  ).toBeVisible();
});

test("catalogues that cannot be refreshed are marked stale, locked, and retryable", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceRun, testInfo);
  await expect(page.getByText("acceptance-job", { exact: true })).toBeVisible();

  // One catalogue is refused outright while another merely fails to refresh. The two outcomes are
  // different and both are the caller's to act on, so neither silences the other.
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/run-failure?status=403&collection=/application`,
  );
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/run-failure?status=503&collection=/workflow`,
  );
  await page.reload();

  await expect(
    page.getByText("Some Run content is unavailable or you no longer have access to it."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Some Run content could not be refreshed. It may be out of date, and definitions that could not be refreshed cannot be run until they load again.",
    ),
  ).toBeVisible();
  // The refused catalogue's content is gone; the one that answered is untouched and still offered.
  await expect(page.getByText("AcceptanceNotebook")).toHaveCount(0);
  await expect(page.getByText("acceptance-job", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  // Retrying recovers everything in place, without any change of project or route.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/run-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("AcceptanceNotebook")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}`);
});
