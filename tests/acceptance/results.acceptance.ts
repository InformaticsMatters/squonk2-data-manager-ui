import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const acceptanceResults = `projects/${fixtureIds.project}/results`;
const screeningResults = `projects/${fixtureIds.screeningProject}/results`;

type Diagnostics = { requests: { method: string; path: string; query: string }[] };

const resultReads = async (
  request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> },
  subject: string,
) => {
  const diagnostics = (await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json())) as Diagnostics;
  return diagnostics.requests.filter(({ path }) =>
    ["/instance", "/task", "/running-workflow"].includes(path),
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
        "x-forwarded-for": `10.5.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

/**
 * The release-blocking regression for issue #1277. Two visibly distinct projects are entered in
 * one session, and every externally observable fact — the URL, the shell identity, the requests
 * the Data Manager receives, the results on screen, the links they generate, what a wrong-scope
 * URL answers, and browser history — is required to name the same project.
 */
test("Results never leave the project in the URL, even across two projects in one session", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceResults, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();

  // Only the addressed project's results are on screen.
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByText("Screening Instance")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Screening Workflow" })).toHaveCount(0);

  // The caller administers this project, so its results are actionable here.
  await expect(page.getByRole("button", { name: "Run again" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Archive" })).toBeEnabled();
  await expect(
    page.getByText("You must be a project editor or administrator", { exact: false }),
  ).toHaveCount(0);

  // Each generated child link addresses the result's own owning project.
  await expect(page.getByRole("link", { name: "Job", exact: true })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.project}/results/instances/${fixtureIds.instance}`,
  );
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.project}/results/workflows/${fixtureIds.runningWorkflow}`,
  );
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.project}/results/tasks/${fixtureIds.resultTask}`,
  );

  await page.goto(screeningResults);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${screeningResults}`);
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Screening Unit · Acceptance Organisation")).toBeVisible();
  await expect(page.getByText("Screening Instance")).toBeVisible();
  await expect(page.getByRole("link", { name: "Screening Workflow" })).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toHaveCount(0);
  // The second project's own tasks are the ones listed under it.
  await expect(page.getByRole("link", { name: "FILE", exact: true })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.screeningProject}/results/tasks/${fixtureIds.screeningResultTask}`,
  );

  // The same caller only observes this project, so the same actions are withheld and explained.
  // Capability presentation therefore follows the project a result belongs to, not the caller.
  await expect(page.getByRole("button", { name: "Archive" })).toBeDisabled();
  await expect(
    page
      .getByText(
        "You must be a project editor or administrator to archive instances in this project.",
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .getByText("You must be a project editor or administrator to delete tasks in this project.")
      .first(),
  ).toBeVisible();

  // Every Results read the Data Manager received named a project, and only ever a project the URL
  // had addressed at the time.
  const reads = await resultReads(request, subject);
  expect(reads.length).toBeGreaterThanOrEqual(6);
  for (const read of reads) {
    expect(read.query).toMatch(
      new RegExp(`project_id=(${fixtureIds.project}|${fixtureIds.screeningProject})`, "u"),
    );
  }
  expect(reads.filter(({ query }) => !query.includes("project_id="))).toEqual([]);

  // A valid result paired with the wrong project is a section-local not-found: no redirect, no
  // discovery of the owner, and the addressed project stays exactly where it was.
  const wrongScope = `${acceptanceResults}/instances/${fixtureIds.screeningInstance}`;
  await page.goto(wrongScope);
  await expect(page.getByText("This result was not found in this project.")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${wrongScope}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Screening Instance")).toHaveCount(0);

  // Back and Forward restore exactly the project each entry addressed.
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${screeningResults}`);
  await expect(page.getByText("Screening Instance")).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${wrongScope}`);
  await expect(page.getByText("This result was not found in this project.")).toBeVisible();
});

test("result details open inside the owning project and link back to its list", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceResults, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();

  await page.getByRole("link", { name: "Job", exact: true }).click();
  const detail = `${acceptanceResults}/instances/${fixtureIds.instance}`;
  await expect(page).toHaveURL(`${acceptanceUrls.app}${detail}`);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  // The instance's logs are a file of the project that owns it.
  await expect(page.getByRole("link", { name: "Logs" })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.project}/files?path=%2F.${fixtureIds.instance}`,
  );

  await page.getByRole("link", { name: "All results" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
});

test("Results filters are owned by Results and do not follow the caller elsewhere", async ({
  page,
}, testInfo) => {
  await login(page, `${acceptanceResults}?type=task&unknown=leaked`, testInfo);

  // An unknown key never survives, so it can never reach a generated request argument.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}?type=task`);
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);

  await page.getByLabel(/Search/u).fill("acceptance workflow");
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}?search=acceptance+workflow&type=task`,
  );

  // Another section of the same project starts from its own state.
  await page.getByRole("link", { name: "Files", exact: true }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/files`);
  await page.getByRole("link", { name: "Results", exact: true }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
});

test("a project viewer reads results and is told what each unavailable action requires", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, acceptanceResults, testInfo);

  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(
    page
      .getByText(
        "You must be a project editor or administrator to stop or delete instances in this project.",
      )
      .first(),
  ).toBeVisible();
  await expect(
    page
      .getByText("You must be a project editor or administrator to delete tasks in this project.")
      .first(),
  ).toBeVisible();
  await expect(
    page
      .getByText("You must be a project editor or administrator to run work in this project.")
      .first(),
  ).toBeVisible();

  // Every mutation the viewer cannot make is offered as an explained, disabled control.
  await expect(page.getByRole("button", { name: "Run again" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Archive" })).toBeDisabled();
  for (const remove of await page.getByRole("button", { name: "Delete", exact: true }).all()) {
    await expect(remove).toBeDisabled();
  }
  // Reading the project's results is not withheld along with the actions.
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();
});

test("results that cannot be refreshed are marked stale, locked, and retryable", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceResults, testInfo);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/results-failure?status=503`);
  await page.reload();
  await expect(
    page.getByText(
      "Results could not be refreshed. The results shown may be out of date, so they cannot be changed until they load again.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/results-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);

  // A confirmed loss of access removes the loaded results rather than leaving them on screen.
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/results-failure?status=403`);
  await page.reload();
  await expect(
    page.getByText("These results are unavailable or you no longer have access to them."),
  ).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);

  // Restored access shows the project's results again without any change of scope.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/results-failure`);
  await page.reload();
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByText("Screening Instance")).toHaveCount(0);

  // One collection answers for itself alone: losing access to instances neither hides the tasks
  // and workflows that answered nor claims they were lost too.
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/results-failure?status=403&collection=/instance`,
  );
  await page.reload();
  await expect(
    page.getByText("These results are unavailable or you no longer have access to them."),
  ).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();
});

test("a refused collection never withholds the retry a transient one needs", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceResults, testInfo);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();

  // Instances are refused outright while running workflows merely fail to refresh. The two
  // outcomes are different and both are the caller's to act on, so neither silences the other.
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/results-failure?status=403&collection=/instance`,
  );
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/results-failure?status=503&collection=/running-workflow`,
  );
  await page.reload();

  await expect(
    page.getByText("These results are unavailable or you no longer have access to them."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Results could not be refreshed. The results shown may be out of date, so they cannot be changed until they load again.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();

  // The refused collection's content is gone; the collection that answered is untouched and still
  // actionable, because it is not stale and was never refused.
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" }).first()).toBeEnabled();

  // Retrying recovers the transient collection in place, without restoring the refused one and
  // without any change of project or route.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/results-failure`);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/results-failure?status=403&collection=/instance`,
  );
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);
  await expect(
    page.getByText("These results are unavailable or you no longer have access to them."),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
});
