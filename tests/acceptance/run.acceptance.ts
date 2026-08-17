import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const acceptanceRun = `projects/${fixtureIds.project}/run`;
const screeningRun = `projects/${fixtureIds.screeningProject}/run`;
const acceptanceResults = `projects/${fixtureIds.project}/results`;

/** One run-workflow command, in the fields the generated body carries. */
type WorkflowLaunch = {
  as_name: string;
  project_id: string;
  variables: string;
  workflow_id: string;
};

type Diagnostics = {
  requests: { method: string; path: string; query: string }[];
  workflowLaunches: WorkflowLaunch[];
};

type Requester = { get: (url: string) => Promise<{ json: () => Promise<unknown> }> };

const diagnosticsFor = async (request: Requester, subject: string) =>
  (await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json())) as Diagnostics;

const scenarioRequests = async (request: Requester, subject: string) =>
  (await diagnosticsFor(request, subject)).requests;

/** Every run-workflow command the Data Manager received, which is what a workflow launch is. */
const workflowLaunches = async (request: Requester, subject: string) =>
  (await diagnosticsFor(request, subject)).workflowLaunches;

const catalogueReads = async (request: Requester, subject: string) =>
  (await scenarioRequests(request, subject)).filter(({ path }) =>
    ["/application", "/job", "/workflow", "/instance", "/running-workflow"].includes(path),
  );

/** Every create-instance command the Data Manager received, which is what a launch actually is. */
const instanceLaunches = async (request: Requester, subject: string) =>
  (await scenarioRequests(request, subject)).filter(
    ({ method, path }) => method === "POST" && path === "/instance",
  );

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

test("a card states its definition's executions and links straight to them", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceRun, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Run" })).toBeVisible();

  // No card lists executions itself. The badge, and the one view it opens, are all there is of
  // that list, so there is one implementation of "the executions of a definition" rather than two.
  await expect(page.getByRole("button", { name: "Show more" })).toHaveCount(0);

  // A workflow card represents the whole definition, so it counts every running workflow started
  // from it; an application card counts every instance of its application, on the same rule the
  // filtered list it links to matches them by.
  await expect(
    page.getByRole("link", { name: "1 execution of Acceptance Workflow Definition" }),
  ).toHaveAttribute(
    "href",
    `/data-manager-ui/${acceptanceResults}?definitionType=workflows&definitionId=${fixtureIds.workflow}`,
  );
  await expect(
    page.getByRole("link", { name: "2 executions of AcceptanceNotebook" }),
  ).toHaveAttribute(
    "href",
    `/data-manager-ui/${acceptanceResults}?definitionType=applications&definitionId=acceptance-application`,
  );

  // A job card counts the version selected on it. This project has only ever run version 1.0.0, so
  // the card's newest version is a known zero rather than an unanswered question.
  const jobCard = page
    .locator(".MuiCard-root")
    .filter({ has: page.getByRole("link", { name: "Run acceptance-job" }) });
  const zero = jobCard.getByRole("link", { name: "0 executions of acceptance-job" });
  await expect(zero).toHaveAttribute(
    "href",
    `/data-manager-ui/${acceptanceResults}?definitionType=jobs&definitionId=2&version=2.0.0`,
  );

  // Choosing another version moves the count and the destination together, so the number on the
  // badge and the list it opens can never disagree about which version they mean.
  await jobCard.getByRole("combobox", { name: "Version" }).click();
  await page.getByRole("option", { name: "1.0.0" }).click();
  const ran = jobCard.getByRole("link", { name: "1 execution of acceptance-job" });
  await expect(ran).toHaveAttribute(
    "href",
    `/data-manager-ui/${acceptanceResults}?definitionType=jobs&definitionId=1&version=1.0.0`,
  );

  // Following it lands on Results carrying the filter, listing exactly what was counted.
  await ran.click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}?definitionType=jobs&definitionId=1&version=1.0.0`,
  );
  await expect(page.getByText("Job: acceptance-job (1.0.0)")).toBeVisible();
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
  await expect(page.getByText("Acceptance Notebook")).toHaveCount(0);
});

test("a definition nothing has run states zero and still links to its own results", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceRun, testInfo);

  // Zero is stated because a read that answered established it, and the badge stays a link: the
  // filtered page it opens gives the answer in its own empty state.
  const badge = page.getByRole("link", { name: "0 executions of unavailable-job" });
  await expect(badge).toBeVisible();
  await badge.click();

  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}?definitionType=jobs&definitionId=3&version=1.0.0`,
  );
  await expect(
    page.getByText("There are no results for Job: unavailable-job (1.0.0) in this project."),
  ).toBeVisible();
});

test("a badge answers for the collection it counts and never reports a failed read as none", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceRun, testInfo);
  await expect(
    page.getByRole("link", { name: "2 executions of AcceptanceNotebook" }),
  ).toBeVisible();

  // Only the instance collection fails. The cards that count it say so rather than claiming their
  // definitions have never run here.
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/results-failure?status=503&collection=/instance`,
  );
  await page.reload();

  await expect(
    page.getByRole("link", { name: "Executions of acceptance-job could not be read" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Executions of AcceptanceNotebook could not be read" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /^0 executions/u })).toHaveCount(0);
  // A card waits only on the collection it counts, so the running-workflow read still answers for
  // the workflow card's badge.
  await expect(
    page.getByRole("link", { name: "1 execution of Acceptance Workflow Definition" }),
  ).toBeVisible();

  // Retrying recovers the counts in place, without any change of project or route.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/results-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(
    page.getByRole("link", { name: "2 executions of AcceptanceNotebook" }),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}`);
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
});

test("launching an application opens the instance it created, in the same project", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, `${acceptanceRun}/applications/acceptance-application`, testInfo);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // An application launch is only offered once it has been named, which is the form's own rule
  // rather than anything the project decides.
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  await dialog.getByLabel("Instance Name").fill("Acceptance notebook run");
  await page.getByRole("button", { name: "Run", exact: true }).click();

  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.launchedInstance}`,
  );
  await expect(
    page.getByRole("banner").getByText("Acceptance Project", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();

  // One accepted launch is one created instance, so nothing was sent twice on the way there.
  expect(await instanceLaunches(request, subject)).toHaveLength(1);
});

test("launching a workflow opens the running workflow it created, in the same project", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const workflowDefinition = `${acceptanceRun}/workflows/${fixtureIds.workflow}`;
  await login(page, workflowDefinition, testInfo);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // The workflow states what it needs, and until it has been given the launch is not offered. The
  // Data Manager creates a running workflow for every command it accepts, so a launch it could
  // only refuse is withheld here rather than sent to earn that refusal.
  await expect(dialog.getByText("Library *")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();

  // The name the running workflow would be created under is held to the Data Manager's own
  // contract, in the field it is entered in.
  await dialog.getByLabel("Workflow name").fill("a");
  await expect(dialog.getByText(/A workflow name is required\./u)).toBeVisible();
  await dialog.getByLabel("Workflow name").fill("Acceptance workflow run");

  // The file is chosen from the project in the URL, so a workflow is only ever given that
  // project's own files.
  await dialog.getByRole("button", { name: "Select file" }).click();
  await dialog.getByRole("checkbox", { name: "acceptance-dataset-v2.sdf" }).check();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();

  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/workflows/${fixtureIds.launchedRunningWorkflow}`,
  );
  await expect(
    page.getByRole("banner").getByText("Acceptance Project", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();

  // One accepted launch is one created running workflow, and the command named the project in the
  // URL, the workflow the URL addressed, and what was entered — never the definition's own
  // declared variables, which the Data Manager would take as the values to run with.
  const launches = await workflowLaunches(request, subject);
  expect(launches).toHaveLength(1);
  expect(launches[0]).toMatchObject({
    as_name: "Acceptance workflow run",
    project_id: fixtureIds.project,
    workflow_id: fixtureIds.workflow,
  });
  const variables = JSON.parse(launches[0]?.variables ?? "{}") as Record<string, unknown>;
  expect(variables.library).toBe("acceptance-dataset-v2.sdf");
  expect(Object.keys(variables)).not.toContain("inputs");
  expect(Object.keys(variables)).not.toContain("options");

  // The running workflow the launch opened is the project's own, listed under the project that
  // ran it, so the launch and everything downstream of it agree about whose work this is.
  await page.goto(acceptanceResults);
  await expect(page.getByRole("link", { name: /Acceptance workflow run/u }).first()).toBeVisible();
});

test("a workflow launch is answered where it was made, without costing the project", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const workflowDefinition = `${acceptanceRun}/workflows/${fixtureIds.workflow}`;
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/launch-delay?milliseconds=3000`,
  );
  await login(page, workflowDefinition, testInfo);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Select file" }).click();
  await dialog.getByRole("checkbox", { name: "acceptance-dataset-v2.sdf" }).check();

  // Sent twice in one gesture, before any answer and before the control could have been redrawn.
  await page.getByRole("button", { name: "Run", exact: true }).dblclick();
  await expect(
    dialog.getByText(
      "This launch has been sent. It cannot be sent again until the Data Manager answers it.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  // Only one command reached the Data Manager, though two submissions were made.
  expect(await workflowLaunches(request, subject)).toHaveLength(1);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDefinition}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  // The answer opens the one running workflow the one accepted launch created.
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/workflows/${fixtureIds.launchedRunningWorkflow}`,
  );
  expect(await workflowLaunches(request, subject)).toHaveLength(1);
});

test("a refused workflow launch is withheld and a failed one stays sendable in place", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const workflowDefinition = `${acceptanceRun}/workflows/${fixtureIds.workflow}`;
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/launch-failure?status=403`);
  await login(page, workflowDefinition, testInfo);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Workflow name").fill("refused workflow run");
  await dialog.getByRole("button", { name: "Select file" }).click();
  await dialog.getByRole("checkbox", { name: "acceptance-dataset-v2.sdf" }).check();
  await page.getByRole("button", { name: "Run", exact: true }).click();

  // The server is the authorization authority, so its refusal answers this one launch and the
  // launch is withheld rather than invited again.
  await expect(
    dialog.getByText(
      "The Data Manager did not allow this to be run in this project. Nothing was launched, and the displayed project and its catalogue have not changed.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();

  // The modal, its route, everything entered, and the catalogue beneath it survive the refusal.
  await expect(dialog.getByLabel("Workflow name")).toHaveValue("refused workflow run");
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDefinition}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("AcceptanceNotebook")).toBeVisible();
  expect(await workflowLaunches(request, subject)).toHaveLength(1);

  // A transport fact decides no authority, so every one of them keeps the launch available, and a
  // refusal of what was entered reads as the service's own account of it.
  await page.reload();
  await dialog.getByRole("button", { name: "Select file" }).click();
  await dialog.getByRole("checkbox", { name: "acceptance-dataset-v2.sdf" }).check();
  for (const [status, message] of [
    [503, "This launch could not be completed, so nothing was launched."],
    [429, "This launch could not be completed, so nothing was launched."],
    [400, "fixture-rejected: the file type is not supported by this project"],
  ] as const) {
    await request.post(
      `${acceptanceUrls.control}/scenario/${subject}/launch-failure?status=${status}`,
    );
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(dialog.getByText(message)).toBeVisible();
    await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();
    await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDefinition}`);
  }

  // A launch that never left the browser at all establishes even less, and is answered the same
  // way. Only interception can produce this, the service never being reached to model it.
  const runWorkflowRequest = `${acceptanceUrls.dataManager}/workflow/*/run`;
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/launch-failure`);
  await page.route(runWorkflowRequest, (route) => route.abort("connectionrefused"));
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    dialog.getByText("This launch could not be completed, so nothing was launched."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDefinition}`);
  await expect(dialog.getByLabel("Workflow name")).toHaveValue("Acceptance Workflow Definition");

  // Sending it again once the service can be reached opens the running workflow finally created.
  await page.unroute(runWorkflowRequest);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/workflows/${fixtureIds.launchedRunningWorkflow}`,
  );
  // Each attempt was one command and no more: the refusal, three the service would not complete,
  // and the one it finally accepted. The launch that never left the browser reached nothing.
  expect(await workflowLaunches(request, subject)).toHaveLength(5);
});

test("an observer reads a workflow definition and is told what launching requires", async ({
  page,
}, testInfo) => {
  await login(page, `${screeningRun}/workflows/${fixtureIds.workflow}`, testInfo);
  const dialog = page.getByRole("dialog");

  // The same workflow, addressed in a project the caller only observes, is readable in full —
  // description and declared inputs alike — while only running it is withheld.
  await expect(dialog).toBeVisible();
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Screens a library against a target")).toBeVisible();
  await expect(dialog.getByText("Library *")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  await expect(
    dialog.getByText("You must be a project editor or administrator to run work in this project."),
  ).toBeVisible();
});

test("the same definition answers for the project it is addressed in", async ({
  page,
}, testInfo) => {
  await login(page, `${acceptanceRun}/jobs/1`, testInfo);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();

  // The same job, addressed in a project the caller only observes, is readable but cannot be run.
  // Nothing but the project in the URL decides that, so no earlier project can carry authority into
  // this one.
  await page.goto(`${screeningRun}/jobs/1`);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  await expect(
    page
      .getByRole("dialog")
      .getByText("You must be a project editor or administrator to run work in this project."),
  ).toBeVisible();
});

test("a launch in flight cannot be sent a second time", async ({ page, request }, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/launch-delay?milliseconds=3000`,
  );
  await login(page, `${acceptanceRun}/jobs/1`, testInfo);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Sent twice in one gesture, before any answer and before the control could have been redrawn.
  // The service creates an execution per request it accepts, so a second submission would run the
  // same work twice.
  await page.getByRole("button", { name: "Run", exact: true }).dblclick();

  // While the Data Manager has yet to answer, the launch says so and is no longer offered.
  await expect(
    dialog.getByText(
      "This launch has been sent. It cannot be sent again until the Data Manager answers it.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  // Only one launch reached the Data Manager, though two submissions were made.
  expect(await instanceLaunches(request, subject)).toHaveLength(1);
  // The definition, its route, and the project it was sent from are all exactly as they were.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}/jobs/1`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  // The answer opens the one execution the one accepted launch created.
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.launchedInstance}`,
  );
  expect(await instanceLaunches(request, subject)).toHaveLength(1);
});

test("a refused launch is withheld rather than offered for a second attempt", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/launch-failure?status=403`);
  await login(page, `${acceptanceRun}/jobs/1`, testInfo);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Job name").fill("refused-run");
  await page.getByRole("button", { name: "Run", exact: true }).click();

  // The server is the authorization authority, so its refusal is reported as feedback about this
  // one launch and the launch is withheld rather than invited again.
  await expect(
    dialog.getByText(
      "The Data Manager did not allow this to be run in this project. Nothing was launched, and the displayed project and its catalogue have not changed.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();

  // The modal, its route, everything entered, and the catalogue beneath it all survive the refusal.
  await expect(dialog.getByLabel("Job name")).toHaveValue("refused-run");
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}/jobs/1`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("acceptance-job", { exact: true })).toBeVisible();
  expect(await instanceLaunches(request, subject)).toHaveLength(1);

  // Closing the refusal returns to the catalogue it was opened over, unchanged.
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}`);
  await expect(page.getByText("AcceptanceNotebook")).toBeVisible();

  // The refusal answered one launch, not the definition: opening it again once access is restored
  // offers the launch afresh, with nothing the refused attempt entered or was told left behind.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/launch-failure`);
  await page.getByRole("link", { name: "Run acceptance-job" }).click();
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("The Data Manager did not allow this to be run in this project."),
  ).toHaveCount(0);
  await expect(dialog.getByLabel("Job name")).not.toHaveValue("refused-run");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.launchedInstance}`,
  );
});

test("a launch that failed for reasons of its own remains recoverable in place", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const dialog = page.getByRole("dialog");
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/launch-failure?status=503`);
  await login(page, `${acceptanceRun}/jobs/1`, testInfo);
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Job name").fill("recoverable-run");

  // A transport fact decides no authority, so every one of them keeps the launch available.
  for (const status of [503, 429]) {
    await request.post(
      `${acceptanceUrls.control}/scenario/${subject}/launch-failure?status=${status}`,
    );
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(
      dialog.getByText(
        "This launch could not be completed, so nothing was launched. The definition and everything entered have been kept, so it can be sent again.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();
    await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceRun}/jobs/1`);
    await expect(dialog.getByLabel("Job name")).toHaveValue("recoverable-run");
  }

  // A refusal of what was entered is the caller's to correct, so it reads as the service's own
  // account of it and the launch stays available.
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/launch-failure?status=400`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    dialog.getByText("fixture-rejected: the file type is not supported by this project"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();

  // Sending it again once the service recovers opens the execution that was finally created.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/launch-failure`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.launchedInstance}`,
  );
  await expect(
    page.getByRole("banner").getByText("Acceptance Project", { exact: true }),
  ).toBeVisible();

  // Each attempt was one request and no more: three the service would not complete, and the one it
  // finally accepted.
  expect(await instanceLaunches(request, subject)).toHaveLength(4);
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
  // What the project requires of every definition alike is a fact of the project, so the catalogue
  // states it once for all the cards it offers rather than repeating it on each of them.
  const requirement = page.getByText(
    "You must be a project editor or administrator to run work in this project.",
  );
  await expect(requirement).toBeVisible();
  await expect(requirement).toHaveCount(1);

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
