import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const acceptanceResults = `projects/${fixtureIds.project}/results`;
const screeningResults = `projects/${fixtureIds.screeningProject}/results`;
const taskDetail = `${acceptanceResults}/tasks/${fixtureIds.resultTask}`;
/** The acceptance project's own task, addressed beneath a project that does not own it. */
const wrongProjectPairing = `${screeningResults}/tasks/${fixtureIds.resultTask}`;

const scenario = (subject: string) => `${acceptanceUrls.control}/scenario/${subject}`;

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(scenario(subjectFor(testInfo)));
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.6.${testInfo.parallelIndex + 1}.${testInfo.line}`,
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

test("a task entered directly opens inside the project that owns it", async ({
  page,
}, testInfo) => {
  await login(page, taskDetail, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${taskDetail}`);
  await projectShellIsRetained(page);

  // The task's own purpose, progress, and product are what the screen is built from.
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toHaveAttribute(
    "href",
    `/data-manager-ui/${taskDetail}`,
  );
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("heading", { name: "States" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
  // The dataset this task produced is addressed by the identity the task itself gave.
  await expect(page.getByRole("link", { name: "Version 2" })).toHaveAttribute(
    "href",
    `/data-manager-ui/datasets/${fixtureIds.dataset}/versions/2`,
  );

  await page.getByRole("link", { name: "All results" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();
});

test("a task that attached a file names the project it attached it to", async ({
  page,
}, testInfo) => {
  const screeningTask = `${screeningResults}/tasks/${fixtureIds.screeningResultTask}`;
  await login(page, screeningTask, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${screeningTask}`);
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  // A file task's product is a file of the project that ran it, addressed inside that project and
  // never through whichever project happens to have been entered before.
  await expect(page.getByRole("link", { name: "Project files" })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.screeningProject}/files`,
  );
  // The Data Manager only promises a dataset identity for a dataset task, so a file task addresses
  // no dataset version at all rather than one this client guessed at.
  await expect(page.getByRole("link", { name: /^Version /u })).toHaveCount(0);
  await expect(page.getByText("Dataset", { exact: true })).toHaveCount(0);
});

test("each lifecycle a task can reach is told apart, and none of them is assumed", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/result-task-stage?stage=running`);
  await login(page, taskDetail, testInfo);

  // Still running: nothing has finished, so nothing about it is reported as an outcome.
  await expect(page.getByText("This task is still running.")).toBeVisible();
  await expect(page.getByText("Running", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await expect(
    page.getByText("This task is still running, so it cannot be deleted until it is done."),
  ).toBeVisible();

  // Finished with a non-zero exit code: the Data Manager's own statement that the work failed.
  await request.post(`${scenario(subject)}/result-task-stage?stage=failed`);
  await page.reload();
  await expect(page.getByText("This task failed with exit code 4.")).toBeVisible();
  await expect(page.getByText("Failed (exit code 4)")).toBeVisible();

  // Finished with a zero exit code but a recorded domain failure: the case an exit code alone
  // would read as success. It is reported as the failure it is, in the words the task gave.
  await request.post(`${scenario(subject)}/result-task-stage?stage=rejected`);
  await page.reload();
  await expect(page.getByText("Molecule 4 could not be parsed.").first()).toBeVisible();
  await expect(page.getByText("Failed", { exact: true })).toBeVisible();

  // Finished cleanly: the only outcome that reads as success.
  await request.post(`${scenario(subject)}/result-task-stage?stage=done`);
  await page.reload();
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${taskDetail}`);
});

test("refreshing the section refreshes the task the URL addresses", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/result-task-stage?stage=running`);
  await login(page, taskDetail, testInfo);
  await expect(page.getByText("This task is still running.")).toBeVisible();

  await request.post(`${scenario(subject)}/result-task-stage?stage=done`);
  await page.getByRole("button", { name: "Refresh results" }).click();

  // The addressed task is refreshed under the project that owns it, in place.
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByText("This task is still running.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${taskDetail}`);
});

test("a running task whose progress cannot be read is not reported as finished", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/result-task-stage?stage=running`);
  await login(page, taskDetail, testInfo);
  await expect(page.getByText("This task is still running.")).toBeVisible();

  // The task keeps running while its progress read starts failing. What it last showed stays on
  // screen, and the read that failed is reported as exactly that rather than as an outcome.
  await request.post(`${scenario(subject)}/result-task-failure?status=503`);
  await page.getByRole("button", { name: "Refresh results" }).click();

  await expect(
    page.getByText("This task's progress could not be read. It is still being checked."),
  ).toBeVisible();
  await expect(page.getByText("Not established")).toBeVisible();
  await expect(page.getByText("Succeeded")).toHaveCount(0);
  // Nothing about a task this client cannot account for can be established as safe to change.
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${taskDetail}`);

  // Once the read answers again the task accounts for itself in place.
  await request.delete(`${scenario(subject)}/result-task-failure`);
  await request.post(`${scenario(subject)}/result-task-stage?stage=done`);
  await page.getByRole("button", { name: "Refresh results" }).click();
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
});

test("a project viewer reads a task and is told what deleting it requires", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${scenario(subjectFor(testInfo))}?profile=read-only`);
  await login(page, taskDetail, testInfo);

  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await expect(
    page.getByText(
      "You must be a project editor or administrator to delete tasks in this project.",
    ),
  ).toBeVisible();
});

test("a rejected deletion preserves the project and route it was rejected in", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/result-task-deletion-failure?status=403`);
  await login(page, taskDetail, testInfo);
  await expect(page.getByText("Succeeded")).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete Task" })
    .getByRole("button", { name: "Delete" })
    .click();

  // The Data Manager's own account of the refusal is reported where the task is, and nothing about
  // the caller's scope changes: same project, same route, same task.
  await expect(page.getByText("fixture-forbidden")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${taskDetail}`);
  await projectShellIsRetained(page);
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toBeVisible();
});

test("a deleted task returns the caller to the list of the project that owned it", async ({
  page,
}, testInfo) => {
  await login(page, taskDetail, testInfo);
  await expect(page.getByText("Succeeded")).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete Task" })
    .getByRole("button", { name: "Delete" })
    .click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await projectShellIsRetained(page);
  // The project's own task collection no longer lists it, and the other results are untouched.
  await expect(page.getByRole("link", { name: "DATASET", exact: true })).toHaveCount(0);
  await expect(page.getByText("Acceptance Instance")).toBeVisible();
});

test("a task paired with a project that does not own it is not found there", async ({
  page,
}, testInfo) => {
  await login(page, wrongProjectPairing, testInfo);

  // Local not-found: no redirect, no discovery of the real owner, and the addressed project stays.
  await expect(page.getByText("This result was not found in this project.")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${wrongProjectPairing}`);
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();
  // Nothing about the task, its dataset, or its owning project is revealed by the pairing.
  await expect(page.getByRole("link", { name: "Version 2" })).toHaveCount(0);
  await expect(page.getByText("Acceptance Project", { exact: true })).toHaveCount(0);
});

test("a refused or missing task read answers exactly as an absent one does", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/result-task-failure?status=403`);
  await login(page, taskDetail, testInfo);

  // A refusal and an absence are the same non-disclosing outcome, and neither of them is allowed
  // to take the project the caller is in away from them.
  for (const status of [403, 404]) {
    await request.post(`${scenario(subject)}/result-task-failure?status=${status}`);
    await page.reload();

    await expect(page.getByText("This result was not found in this project.")).toBeVisible();
    await expect(page).toHaveURL(`${acceptanceUrls.app}${taskDetail}`);
    await projectShellIsRetained(page);
    await expect(page.getByRole("link", { name: "Version 2" })).toHaveCount(0);
  }
});

test("a task read that merely failed is retried without leaving the project", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/result-task-failure?status=503`);
  await login(page, taskDetail, testInfo);

  // A transport failure says nothing about the task, so it is offered for retry rather than
  // reported as an absence.
  await expect(
    page.getByText("This result could not be loaded. Retry it without leaving this project."),
  ).toBeVisible();
  await expect(page.getByText("This result was not found in this project.")).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${taskDetail}`);
  await projectShellIsRetained(page);

  await request.delete(`${scenario(subject)}/result-task-failure`);
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${taskDetail}`);
});
