import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const acceptanceResults = `projects/${fixtureIds.project}/results`;
const screeningResults = `projects/${fixtureIds.screeningProject}/results`;
const workflowDetail = `${acceptanceResults}/workflows/${fixtureIds.runningWorkflow}`;
/** The acceptance project's own workflow, addressed beneath a project that does not own it. */
const wrongProjectPairing = `${screeningResults}/workflows/${fixtureIds.runningWorkflow}`;

const scenario = (subject: string) => `${acceptanceUrls.control}/scenario/${subject}`;

type Diagnostics = { requests: { method: string; path: string }[] };

/** Every path the Data Manager was asked for, so what was never asked for can be stated exactly. */
const readPaths = async (
  request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> },
  subject: string,
) => {
  const diagnostics = (await request
    .get(scenario(subject))
    .then((response) => response.json())) as Diagnostics;
  return diagnostics.requests.map(({ path }) => path);
};

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(scenario(subjectFor(testInfo)));
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

const projectShellIsRetained = async (page: Page) => {
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
};

test("a running workflow entered directly opens inside the project that owns it", async ({
  page,
}, testInfo) => {
  await login(page, workflowDetail, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDetail}`);
  await projectShellIsRetained(page);

  // The workflow's own identity, definition, progress, and steps are what the screen is built from.
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toHaveAttribute(
    "href",
    `/data-manager-ui/${workflowDetail}`,
  );
  await expect(page.getByText("acceptance-workflow")).toBeVisible();
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Workflow Steps" })).toBeVisible();

  // A step that ran as an instance is addressed in the project that owns the workflow, and a step
  // that never became one is still listed rather than linked to somewhere this client invented.
  await expect(page.getByRole("link", { name: "Prepare library" })).toHaveAttribute(
    "href",
    `/data-manager-ui/${acceptanceResults}/instances/${fixtureIds.instance}`,
  );
  await expect(page.getByText("Report results")).toBeVisible();
  await expect(page.getByRole("link", { name: "Report results" })).toHaveCount(0);

  await page.getByRole("link", { name: "All results" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
});

test("each lifecycle a workflow can reach is told apart, and none of them is assumed", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=running`);
  await login(page, workflowDetail, testInfo);

  // Still running: nothing has finished, so the control the Data Manager would take is a stop.
  await expect(page.getByText("This workflow is still running.")).toBeVisible();
  await expect(page.getByText("Running", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);

  // Finished with a failure status: the Data Manager's own statement that the work failed.
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=failed`);
  await page.reload();
  await expect(page.getByText("Step 2 could not be scheduled.")).toBeVisible();
  await expect(page.getByText("Failed", { exact: true })).toBeVisible();

  // Finished with a successful status but a recorded error: the case a status alone would read as
  // a completed run. It is reported as the failure it is, in the words the workflow gave.
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=rejected`);
  await page.reload();
  await expect(page.getByText("Step 2 produced no output.")).toBeVisible();
  await expect(page.getByText("Failed", { exact: true })).toBeVisible();

  // Stopped by a caller: neither a success nor a failure, and reported as neither.
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=stopped`);
  await page.reload();
  await expect(page.getByText("This workflow was stopped before it finished.")).toBeVisible();
  await expect(page.getByText("Stopped", { exact: true })).toBeVisible();

  // A status this client has no rule for establishes nothing: it is neither a running workflow nor
  // a finished one, so neither request is offered for it.
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=unrecognised`);
  await page.reload();
  await expect(
    page.getByText("This workflow's progress could not be established. Retry to check it again."),
  ).toBeVisible();
  await expect(page.getByText("Not established")).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeDisabled();
  await expect(
    page.getByText(
      "This workflow's progress could not be established, so stopping or deleting it cannot be established as safe.",
    ),
  ).toBeVisible();

  // Finished cleanly: the only outcome that reads as success, and the only one that can be deleted.
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=done`);
  await page.reload();
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDetail}`);
});

test("a workflow opened from its project's list shows the steps of that same workflow", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceResults, testInfo);

  // The workflow's own card, opened where its project lists it.
  const workflowCard = page
    .locator(".MuiCard-root")
    .filter({ has: page.getByRole("link", { name: "Acceptance Workflow" }) });
  await workflowCard.getByRole("button", { name: "Show more" }).click();

  // The listed card reads the workflow it lists through the same owner its own route reads it
  // through, and every step it shows is addressed in the project that owns the workflow.
  await expect(page.getByRole("heading", { name: "Workflow Steps" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Prepare library" })).toHaveAttribute(
    "href",
    `/data-manager-ui/${acceptanceResults}/instances/${fixtureIds.instance}`,
  );
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
});

test("refreshing the section refreshes the workflow the URL addresses", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=running`);
  await login(page, workflowDetail, testInfo);
  await expect(page.getByText("This workflow is still running.")).toBeVisible();

  await request.post(`${scenario(subject)}/running-workflow-stage?stage=done`);
  await page.getByRole("button", { name: "Refresh results" }).click();

  // The addressed workflow is refreshed under the project that owns it, in place.
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByText("This workflow is still running.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDetail}`);
});

test("a running workflow whose progress cannot be read is not reported as finished", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=running`);
  await login(page, workflowDetail, testInfo);
  await expect(page.getByText("This workflow is still running.")).toBeVisible();

  // The workflow keeps running while its progress read starts failing. What it last showed stays
  // on screen, and the read that failed is reported as exactly that rather than as an outcome.
  await request.post(`${scenario(subject)}/running-workflow-failure?status=503`);
  await page.getByRole("button", { name: "Refresh results" }).click();

  await expect(
    page.getByText("This workflow's progress could not be read. It is still being checked."),
  ).toBeVisible();
  await expect(page.getByText("Not established")).toBeVisible();
  await expect(page.getByText("Succeeded")).toHaveCount(0);
  // Content this client could not refresh cannot be established as safe to stop or delete.
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeDisabled();
  await expect(
    page.getByText(
      "This result could not be refreshed, so changing it cannot be established as safe.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDetail}`);

  // Once the read answers again the workflow accounts for itself in place.
  await request.delete(`${scenario(subject)}/running-workflow-failure`);
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=done`);
  await page.getByRole("button", { name: "Refresh results" }).click();
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
});

test("steps that could not be read are not read as a workflow that took none", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/running-workflow-steps-failure?status=503`);
  await login(page, workflowDetail, testInfo);

  // The workflow itself answered, so it is still readable and still actionable; only its steps
  // could not be read, and they say so rather than reporting a workflow that took no steps.
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByText("The steps of this workflow could not be read.")).toBeVisible();
  await expect(page.getByText("No steps found for this workflow.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();

  await request.delete(`${scenario(subject)}/running-workflow-steps-failure`);
  await page.getByRole("button", { name: "Refresh results" }).click();
  await expect(page.getByRole("link", { name: "Prepare library" })).toBeVisible();
});

test("a project viewer reads a workflow and is told what changing it requires", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${scenario(subjectFor(testInfo))}?profile=read-only`);
  await login(page, workflowDetail, testInfo);

  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("link", { name: "Prepare library" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await expect(
    page.getByText(
      "You must be a project editor or administrator to stop or delete workflows in this project.",
    ),
  ).toBeVisible();
});

test("a rejected stop preserves the project and route it was rejected in", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=running`);
  await request.post(`${scenario(subject)}/running-workflow-command-failure?status=403`);
  await login(page, workflowDetail, testInfo);
  await expect(page.getByText("This workflow is still running.")).toBeVisible();

  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Stop Workflow" })
    .getByRole("button", { name: "Stop" })
    .click();

  // The Data Manager's own account of the refusal is reported where the workflow is, and nothing
  // about the caller's scope changes: same project, same route, same workflow.
  await expect(page.getByText("fixture-forbidden")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDetail}`);
  await projectShellIsRetained(page);
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
  await expect(page.getByText("This workflow is still running.")).toBeVisible();
});

test("a stopped workflow stays where it is and says what it became", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=running`);
  await login(page, workflowDetail, testInfo);
  await expect(page.getByText("This workflow is still running.")).toBeVisible();

  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Stop Workflow" })
    .getByRole("button", { name: "Stop" })
    .click();

  // A stop is not a deletion: the workflow still exists, still has its own route, and now accounts
  // for itself as the stopped workflow it is.
  await expect(page.getByText("Workflow has been stopped")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDetail}`);
  await expect(page.getByText("This workflow was stopped before it finished.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
});

test("a deleted workflow returns the caller to the list of the project that owned it", async ({
  page,
}, testInfo) => {
  await login(page, workflowDetail, testInfo);
  await expect(page.getByText("Succeeded")).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete Workflow" })
    .getByRole("button", { name: "Delete" })
    .click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await projectShellIsRetained(page);
  // The project's own workflow collection no longer lists it, and the other results are untouched.
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toHaveCount(0);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
});

test("a workflow paired with a project that does not own it is not found there", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/running-workflow-stage?stage=running`);
  await login(page, wrongProjectPairing, testInfo);

  // Local not-found: no redirect, no discovery of the real owner, and the addressed project stays.
  await expect(page.getByText("This result was not found in this project.")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${wrongProjectPairing}`);
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();
  // Nothing about the workflow, its steps, or its owning project is revealed by the pairing.
  await expect(page.getByRole("link", { name: "Prepare library" })).toHaveCount(0);
  await expect(page.getByText("Acceptance Workflow")).toHaveCount(0);
  await expect(page.getByText("Acceptance Project", { exact: true })).toHaveCount(0);

  // Reading the workflow once is the only way to learn it belongs elsewhere. Nothing past that
  // answer is asked: its steps are never requested, and it is a workflow that would otherwise
  // still be polled.
  const paths = await readPaths(request, subject);
  expect(paths).toContain(`/running-workflow/${fixtureIds.runningWorkflow}`);
  expect(paths).not.toContain(`/running-workflow/${fixtureIds.runningWorkflow}/steps`);
});

test("a refused or missing workflow read answers exactly as an absent one does", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/running-workflow-failure?status=403`);
  await login(page, workflowDetail, testInfo);

  // A refusal and an absence are the same non-disclosing outcome, and neither of them is allowed
  // to take the project the caller is in away from them.
  for (const status of [403, 404]) {
    await request.post(`${scenario(subject)}/running-workflow-failure?status=${status}`);
    await page.reload();

    await expect(page.getByText("This result was not found in this project.")).toBeVisible();
    await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDetail}`);
    await projectShellIsRetained(page);
    await expect(page.getByRole("link", { name: "Prepare library" })).toHaveCount(0);
  }
});

test("a workflow read that merely failed is retried without leaving the project", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/running-workflow-failure?status=503`);
  await login(page, workflowDetail, testInfo);

  // A transport failure says nothing about the workflow, so it is offered for retry rather than
  // reported as an absence.
  await expect(
    page.getByText("This result could not be loaded. Retry it without leaving this project."),
  ).toBeVisible();
  await expect(page.getByText("This result was not found in this project.")).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDetail}`);
  await projectShellIsRetained(page);

  await request.delete(`${scenario(subject)}/running-workflow-failure`);
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${workflowDetail}`);
});
