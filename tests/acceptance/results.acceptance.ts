import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const acceptanceResults = `projects/${fixtureIds.project}/results`;
const screeningResults = `projects/${fixtureIds.screeningProject}/results`;

type DiagnosticRequest = { method: string; path: string; query: string };
type Diagnostics = { requests: DiagnosticRequest[] };

const diagnosticReads = async (
  request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> },
  subject: string,
  paths: readonly string[],
) => {
  const diagnostics = (await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json())) as Diagnostics;
  return diagnostics.requests.filter(({ path }) => paths.includes(path));
};

const resultReads = async (
  request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> },
  subject: string,
) => diagnosticReads(request, subject, ["/instance", "/task", "/running-workflow"]);

/**
 * The definition catalogues, which only a filtered Results page reads. The running-workflow
 * collection is `/running-workflow`, so `/workflow` here is the workflow *definitions* alone.
 */
const catalogueReads = async (
  request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> },
  subject: string,
) => diagnosticReads(request, subject, ["/application", "/job", "/workflow"]);

/** What one read was, without how many times it happened, so two page loads can be compared. */
const readSignatures = (reads: readonly DiagnosticRequest[]) =>
  [...new Set(reads.map(({ method, path, query }) => `${method} ${path}${query}`))].toSorted();

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
  await expect(page.getByRole("button", { name: "Archive" }).first()).toBeEnabled();
  await expect(
    page.getByText("You must be a project editor or administrator", { exact: false }),
  ).toHaveCount(0);

  // Each generated child link addresses the result's own owning project.
  await expect(page.getByRole("link", { name: "Acceptance Instance" })).toHaveAttribute(
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

  await page.getByRole("link", { name: "Acceptance Instance" }).click();
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

  // Results state is local to the route it is on: entering a second project's Results resets the
  // search box and the type filter to that route's own state rather than inheriting the first's.
  await page.goto(`${acceptanceResults}?search=acceptance+workflow&type=workflow`);
  await expect(page.getByLabel(/Search/u)).toHaveValue("acceptance workflow");
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toHaveCount(0);

  await page.goto(screeningResults);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${screeningResults}`);
  await expect(page.getByLabel(/Search/u)).toHaveValue("");
  // Nothing the first project filtered narrows the second: its own unfiltered results are shown.
  await expect(page.getByText("Screening Instance")).toBeVisible();
  await expect(page.getByRole("link", { name: "FILE", exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);
});

test("the narrowing controls sit in a rail beside the list and the heading counts what they leave", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceResults, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toBeVisible();

  // Nothing is narrowed, so the heading states the whole list once rather than as a fraction of
  // itself, and the type filter says it has narrowed nothing rather than reading back every label
  // it offers as though the caller had chosen all of them.
  const count = page.getByText(/^\d+ results$/u);
  const total = Number(((await count.textContent()) ?? "").split(" ")[0]);
  expect(total).toBeGreaterThan(1);
  // The control is addressed by the role it plays rather than by the label alone, because an open
  // menu is labelled by the same name as the control that opened it.
  const filter = page.getByRole("combobox", { name: "Filter Results" });
  await expect(filter).toHaveText("All types");

  // Both controls that act on the page rather than narrow it are named in words, so what they do
  // is readable without hovering an icon.
  await expect(page.getByRole("button", { name: "Refresh results" })).toHaveText("Refresh results");
  await expect(page.getByText("Event debug")).toBeVisible();

  // The rail is beside the list: everything the list column holds starts to the right of it.
  const railBox = await filter.boundingBox();
  const searchBox = await page.getByLabel(/Search/u).boundingBox();
  expect(searchBox?.x ?? 0).toBeGreaterThan((railBox?.x ?? 0) + (railBox?.width ?? 0));

  // The filter states what it narrowed to as one chip per type, and the heading states how much of
  // the project's results that left.
  await filter.click();
  await page.getByRole("option", { name: "Tasks" }).click();
  await page.getByRole("option", { name: "Instances" }).click();
  await page.keyboard.press("Escape");

  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}?type=workflow`);
  await expect(filter).toHaveText("Workflows");
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);
  await expect(page.getByText(`1 of ${total}`)).toBeVisible();

  // Emptying the filter is clearing it: the route carries no narrowing either way, so the control
  // states that rather than a selection of everything it offers.
  await filter.click();
  await page.getByRole("option", { name: "Workflows" }).click();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(filter).toHaveText("All types");
  await expect(page.getByText(`${total} results`)).toBeVisible();

  // The rail stays reachable however far a long list is scrolled.
  await page.setViewportSize({ height: 400, width: 1280 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(filter).toBeInViewport();

  // On a phone the rail stacks above the list rather than squeezing beside it, so every control is
  // reachable without scrolling sideways.
  const narrow = { height: 720, width: 360 };
  await page.setViewportSize(narrow);
  await page.evaluate(() => window.scrollTo(0, 0));
  const stackedRail = await filter.boundingBox();
  const stackedSearch = await page.getByLabel(/Search/u).boundingBox();
  expect(stackedRail?.x).toBeCloseTo(stackedSearch?.x ?? 0, 0);
  expect(stackedRail?.y ?? 0).toBeLessThan(stackedSearch?.y ?? 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    narrow.width,
  );
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
  await expect(page.getByRole("button", { name: "Archive" }).first()).toBeDisabled();
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
      "Some results could not be refreshed. Those results may be out of date, so they cannot be changed until they load again.",
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
      "Some results could not be refreshed. Those results may be out of date, so they cannot be changed until they load again.",
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

test("only the collection that could not be refreshed is marked stale and locked", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceResults, testInfo);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByRole("button", { name: "Archive" }).first()).toBeEnabled();

  // Refreshing in place keeps what already loaded, so a collection that fails this time is stale
  // rather than absent — which is the only way the per-collection lock is observable at all.
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/results-failure?status=503&collection=/instance`,
  );
  await page.getByRole("button", { name: "Refresh results" }).click();

  await expect(
    page.getByText(
      "Some results could not be refreshed. Those results may be out of date, so they cannot be changed until they load again.",
    ),
  ).toBeVisible();

  // The instance is still readable, and says why it cannot be changed.
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByRole("button", { name: "Archive" }).first()).toBeDisabled();
  await expect(
    page
      .getByText(
        "This result could not be refreshed, so changing it cannot be established as safe.",
      )
      .first(),
  ).toBeVisible();

  // The collections that did answer are untouched: neither stale nor locked.
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" }).first()).toBeEnabled();

  // An addressed result answers for itself, so a stale collection does not lock it: its own read
  // succeeded, and it stays readable and changeable at its own route.
  await page.goto(`${acceptanceResults}/instances/${fixtureIds.instance}`);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByRole("button", { name: "Archive" })).toBeEnabled();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.instance}`,
  );
});

/** The version of the acceptance job this project has actually run, and one it never has. */
const ranJob = `${acceptanceResults}?definitionType=jobs&definitionId=1&version=1.0.0`;
const unrunJob = `${acceptanceResults}?definitionType=jobs&definitionId=2&version=2.0.0`;
/** The same job across every version, named by an identifier belonging to another version of it. */
const everyJobVersion = `${acceptanceResults}?definitionType=jobs&definitionId=2`;

test("a deep link lists one definition's executions and changes nothing about what is fetched", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceResults, testInfo);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByText("Acceptance Notebook")).toBeVisible();
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();

  const unfiltered = await resultReads(request, subject);
  // The unfiltered page pays nothing for a filter it is not carrying.
  expect(await catalogueReads(request, subject)).toEqual([]);

  await page.goto(ranJob);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${ranJob}`);

  // Only that job's instances are listed. The other application's instance, the running workflow
  // and the task carry no job identity at all, so none of them can be an execution of this job.
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByText("Acceptance Notebook")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toHaveCount(0);

  // The narrowing is entirely client-side: the requests the Data Manager received for the results
  // collections are exactly the ones the unfiltered page made, arguments and all.
  const filtered = (await resultReads(request, subject)).slice(unfiltered.length);
  expect(readSignatures(filtered)).toEqual(readSignatures(unfiltered));

  // The one read the filter does add is the catalogue that names the definition, and only the
  // catalogue the filter's own type is published by.
  const catalogue = await catalogueReads(request, subject);
  expect(catalogue.length).toBeGreaterThanOrEqual(1);
  expect([...new Set(catalogue.map(({ path }) => path))]).toEqual(["/job"]);

  // Capabilities on a filtered result are the unfiltered ones: what may be done to a result never
  // depends on how the caller navigated to it.
  await expect(page.getByRole("button", { name: "Run again" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Archive" }).first()).toBeEnabled();
  // Refreshing a filtered list keeps the filter and the project it was addressed under.
  await page.getByRole("button", { name: "Refresh results" }).click();
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${ranJob}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
});

test("a version narrows to one version of a definition and its absence keeps them all", async ({
  page,
}, testInfo) => {
  await login(page, unrunJob, testInfo);

  // This project ran version 1.0.0 of the job and never 2.0.0, so the version narrows to nothing.
  // The empty state names what it was narrowed to, so "this version has never run here" is
  // distinguishable from a broken page — and it names it in the one case no matched result could.
  await expect(
    page.getByText("There are no results for Job: acceptance-job (2.0.0) in this project."),
  ).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);
  // The chip names the definition here too: a name taken from a matched result would be missing in
  // exactly this case, which is where a caller most needs to be told what they are looking at.
  await expect(page.getByText("Job: acceptance-job (2.0.0)", { exact: true })).toBeVisible();

  // The identifier in the URL is one version's, but identity is the job itself, so dropping the
  // version lists every version's executions — including one launched from a different version.
  await page.goto(everyJobVersion);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByText("Acceptance Notebook")).toHaveCount(0);

  // The search box still narrows within the filtered list.
  await page.getByLabel(/Search/u).fill("acceptance instance");
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}?search=acceptance+instance&definitionType=jobs&definitionId=2`,
  );
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await page.getByLabel(/Search/u).fill("nothing matches this");
  // The caller's own search emptied a list this definition has plenty in, so the empty state does
  // not report their narrowing as the definition's silence.
  await expect(
    page.getByText("There are no tasks, instances, or workflows to display."),
  ).toBeVisible();
  await expect(
    page.getByText("There are no results for Job: acceptance-job in this project."),
  ).toHaveCount(0);
});

test("a chip states the active filter, replaces the type filter, and clears back to the whole list", async ({
  page,
}, testInfo) => {
  await login(page, ranJob, testInfo);

  // The chip names the definition the catalogue resolved and the version the URL carries.
  await expect(page.getByText("Job: acceptance-job (1.0.0)")).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  // Exactly one kind of result can match a definition, so the type filter is not offered at all:
  // every entry in it would be a no-op or self-defeating.
  await expect(page.getByLabel("Filter Results")).toHaveCount(0);

  // The clear affordance is a control with a name, so a screen reader can reach and announce it.
  const clear = page.getByRole("button", { name: "Clear definition filter" });
  await expect(clear).toBeVisible();

  // Both stay legible and tappable on a phone: the chip wraps inside the viewport rather than
  // pushing the page sideways, and the clear control keeps a tap target above the 24px minimum.
  const narrow = { height: 720, width: 360 };
  await page.setViewportSize(narrow);
  await expect(page.getByText("Job: acceptance-job (1.0.0)")).toBeVisible();
  const tapTarget = await clear.boundingBox();
  expect(tapTarget?.height ?? 0).toBeGreaterThanOrEqual(24);
  expect(tapTarget?.width ?? 0).toBeGreaterThanOrEqual(24);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    narrow.width,
  );

  await clear.click();

  // Clearing removes the whole filter — all three keys — and leaves nothing else behind: the type
  // filter returns and the unfiltered list is back, with no narrowing the caller never chose.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByText("Job: acceptance-job")).toHaveCount(0);
  await expect(page.getByLabel("Filter Results")).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByText("Acceptance Notebook")).toBeVisible();
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();
});

test("a definition filter states itself where the type filter was, moving neither search nor list", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceResults, testInfo);
  const filterBox = await page.getByLabel("Filter Results").boundingBox();
  const searchBox = await page.getByLabel(/Search/u).boundingBox();
  const listBox = await page.getByText("Acceptance Instance").first().boundingBox();

  await page.goto(ranJob);
  await expect(page.getByText("Job: acceptance-job (1.0.0)")).toBeVisible();
  await expect(page.getByLabel("Filter Results")).toHaveCount(0);

  // Whatever is narrowing the list is always in the same place: the chip states the filter inside
  // the rail the type filter was in, not in a row of its own below the chrome.
  const chipBox = await page.getByText("Job: acceptance-job (1.0.0)").boundingBox();
  expect(chipBox?.x ?? 0).toBeGreaterThanOrEqual(filterBox?.x ?? 0);
  expect((chipBox?.x ?? 0) + (chipBox?.width ?? 0)).toBeLessThanOrEqual(searchBox?.x ?? 0);

  // Applying the filter rearranges nothing beneath it. The search field is exactly where it was,
  // so nothing above the list reflowed, and the list column starts where it started, so a chip
  // wide enough to need more lines grows the rail downwards rather than moving the list.
  expect(await page.getByLabel(/Search/u).boundingBox()).toEqual(searchBox);
  expect((await page.getByText("Acceptance Instance").first().boundingBox())?.x).toEqual(
    listBox?.x,
  );
});

test("a definition filter withdraws the type filter before the catalogue has named it", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceResults, testInfo);
  await expect(page.getByLabel("Filter Results")).toBeVisible();

  // The definition catalogue is held open, so the page can be examined while the read that would
  // name the filter is still outstanding.
  const { promise: held, resolve: answer } = Promise.withResolvers<"answered">();
  const { promise: outstanding, resolve: reached } = Promise.withResolvers<"reached">();
  await page.route(/\/job(\?|$)/u, async (route) => {
    reached("reached");
    await held;
    await route.continue();
  });

  await page.goto(ranJob);
  await outstanding;
  // The rail is on screen and the read that would name the definition has not answered.
  await expect(page.getByRole("button", { name: "Refresh results" })).toBeVisible();

  // What the route carries withdraws the type filter, not what the catalogue eventually says about
  // it: a choice made in a filter offered during this wait could only be written by dropping the
  // definition the caller has just followed. Both counts are snapshots rather than waited-on
  // assertions, so a control shown only for the length of the read still fails them.
  expect(await page.getByLabel("Filter Results").count()).toBe(0);
  expect(await page.getByRole("button", { name: "Clear definition filter" }).count()).toBe(0);

  answer("answered");
  await expect(page.getByText("Job: acceptance-job (1.0.0)")).toBeVisible();
  await expect(page.getByLabel("Filter Results")).toHaveCount(0);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
});

test("a workflow filter lists the running workflows started from that definition", async ({
  page,
}, testInfo) => {
  await login(
    page,
    `${acceptanceResults}?definitionType=workflows&definitionId=${fixtureIds.workflow}`,
    testInfo,
  );

  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  // The chip names the workflow definition, which is not what any running workflow started from it
  // is called, so the name can only have come from the catalogue that publishes the definition.
  await expect(page.getByText("Workflow: Acceptance Workflow Definition")).toBeVisible();
  // Instances name no workflow definition and tasks name nothing at all, so neither can match.
  await expect(page.getByText("Acceptance Instance")).toHaveCount(0);
  await expect(page.getByText("Acceptance Notebook")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toHaveCount(0);
  // A filtered list still cannot reach another project's work.
  await expect(page.getByRole("link", { name: "Screening Workflow" })).toHaveCount(0);
});

test("a filter naming a definition the catalogue does not contain leaves a usable page", async ({
  page,
}, testInfo) => {
  const missing = `${acceptanceResults}?definitionType=jobs&definitionId=99`;
  await login(page, missing, testInfo);

  await expect(
    page.getByText(
      "The definition these results were filtered to was not found, so every result in this project is shown.",
    ),
  ).toBeVisible();
  // A stale link is a dead link rather than a dead end: the whole list is shown, and the URL is
  // left exactly as it was addressed.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${missing}`);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();

  // Nothing resolved, so nothing names a definition — but the filter still displaced the type
  // filter, so it is still stated and still clearable rather than leaving the caller with neither
  // control and only the URL to edit.
  await expect(page.getByLabel("Filter Results")).toHaveCount(0);
  await expect(page.getByText("Job filter")).toBeVisible();
  await page.getByRole("button", { name: "Clear definition filter" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByLabel("Filter Results")).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
});

test("the definition catalogue read is reported and retried like any other Results read", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/run-failure?status=503`);
  await login(page, ranJob, testInfo);

  await expect(
    page.getByText(
      "Some results could not be refreshed. Those results may be out of date, so they cannot be changed until they load again.",
    ),
  ).toBeVisible();
  // The catalogue's failure decides nothing for the collections beside it: their content is
  // neither cleared nor narrowed by a definition nothing could resolve.
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" }).first()).toBeEnabled();
  // The definition was never established as absent, so it is not reported as one.
  await expect(
    page.getByText("was not found, so every result in this project is shown"),
  ).toHaveCount(0);
  // The catalogue could not name it, so the chip states the kind of filter that is active instead
  // — and stays clearable, because the type filter it displaced cannot come back until it is.
  await expect(page.getByLabel("Filter Results")).toHaveCount(0);
  await expect(page.getByText("Job filter")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear definition filter" })).toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/run-failure`);
  await page.getByRole("button", { name: "Retry" }).click();

  // Retrying resolves the definition in place, without any change of project or route.
  await expect(page.getByText("Job: acceptance-job (1.0.0)")).toBeVisible();
  await expect(page.getByText("Acceptance Notebook")).toHaveCount(0);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${ranJob}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
});
