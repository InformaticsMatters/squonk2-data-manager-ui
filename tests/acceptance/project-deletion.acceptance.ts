import { type APIRequestContext, expect, type Page, test, type TestInfo } from "@playwright/test";

import { PROJECT_DELETION_RECOVERY_KEY } from "../../src/projects/projectDeletion";
import { RECENT_PROJECTS_STORAGE_KEY } from "../../src/projects/recentProjects";
import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;
const scenario = (subject: string) => `${acceptanceUrls.control}/scenario/${subject}`;

const managePath = `projects/${fixtureIds.project}/manage`;
const deletionPath = `projects/deletions/${fixtureIds.projectDeletionTask}`;
const deletionUrl = `${acceptanceUrls.app}${deletionPath}?subscription=${fixtureIds.product}`;

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(scenario(subjectFor(testInfo)));
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.12.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

/** Confirms the destructive action from Manage, which is the only place a deletion may start. */
const startDeletion = async (page: Page) => {
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();
  await page.getByRole("button", { name: "Delete project" }).click();
  await expect(page.getByText(/This cannot be undone/u)).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Delete project" }).click();
};

/** Every request the fixture services received for this scenario, in the order they arrived. */
const requestsMade = async (request: APIRequestContext, subject: string) => {
  const diagnostics = (await request
    .get(scenario(subject))
    .then((response) => response.json())) as { requests: { method: string; path: string }[] };
  return diagnostics.requests;
};

const countRequests = async (request: APIRequestContext, subject: string, path: string) =>
  (await requestsMade(request, subject)).filter(
    (made) => made.method === "DELETE" && made.path === path,
  ).length;

const projectPath = `/project/${fixtureIds.project}`;
const productPath = `/product/${fixtureIds.product}`;

/**
 * One support identifier as the page states it. The row is addressed rather than the bare text,
 * because the same identifiers appear in the canonical URL the route announcer reads out.
 */
const diagnostic = (page: Page, label: string) =>
  page.getByRole("listitem").filter({ hasText: new RegExp(`^${label}`, "u") });

test("an authorized deletion leaves the project for its own progress route", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, managePath, testInfo);
  await startDeletion(page);

  // The progress resource is outside the project, and carries only the task and the subscription.
  await expect(page).toHaveURL(deletionUrl);
  await expect(page.getByRole("heading", { level: 1, name: "Deleting project" })).toBeVisible();
  await expect(diagnostic(page, "Deletion task ID")).toContainText(fixtureIds.projectDeletionTask);
  await expect(diagnostic(page, "Subscription ID")).toContainText(fixtureIds.product);
  await expect(
    page.getByRole("link", { name: "Open this subscription in Administration" }),
  ).toHaveAttribute("href", `/data-manager-ui/administration/subscriptions/${fixtureIds.product}`);

  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  // Completion returns to the index only once both phases succeeded, so both were sent exactly once.
  await expect.poll(() => countRequests(request, subject, projectPath)).toBe(1);
  await expect.poll(() => countRequests(request, subject, productPath)).toBe(1);
  // The project the deletion removed is gone from the index it used to appear in.
  await expect(page.getByText("Acceptance Project", { exact: true })).toHaveCount(0);
});

test("a deletion in progress survives a reload and clears the project it confirmed", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  // Reading the task fails while the deletion is pending, so the page stays on the polling phase
  // long enough for a reload to be the thing under test rather than a race with completion.
  await request.post(`${scenario(subject)}/project-deletion-task-failure?status=503`);
  await login(page, managePath, testInfo);
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .toContain(fixtureIds.project);
  await startDeletion(page);

  await expect(page).toHaveURL(deletionUrl);
  await expect(page.getByText(/could not be read. It is still being checked/u)).toBeVisible();

  // The route is the whole workflow identity, so a reload resumes the same deletion.
  await page.reload();
  await expect(page).toHaveURL(deletionUrl);
  await expect(page.getByRole("heading", { level: 1, name: "Deleting project" })).toBeVisible();
  await expect(diagnostic(page, "Deletion task ID")).toContainText(fixtureIds.projectDeletionTask);
  // A read that could not be made is not a deletion, so nothing loaded has been cleared yet.
  expect(
    await page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY),
  ).toContain(fixtureIds.project);
  await expect.poll(() => countRequests(request, subject, productPath)).toBe(0);

  await request.delete(`${scenario(subject)}/project-deletion-task-failure`);
  await page.reload();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`, { timeout: 30_000 });
  // Only a confirmed deletion clears the project's loaded content and its place in recents.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .not.toContain(fixtureIds.project);
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), PROJECT_DELETION_RECOVERY_KEY))
    .toBeNull();
});

test("a nonzero deletion exit code stops the subscription cleanup", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/project-deletion-exit-code?value=3`);
  await login(page, managePath, testInfo);
  await startDeletion(page);

  await expect(page.getByText("This task failed with exit code 3.")).toBeVisible();
  await expect(page.getByText(/The subscription was left exactly as it was/u)).toBeVisible();
  // A failed deletion is never restarted, so the page offers diagnostics and a way out, not a retry.
  await expect(page.getByRole("button", { name: /Retry|Check again/u })).toHaveCount(0);
  await expect(diagnostic(page, "Deletion task ID")).toContainText(fixtureIds.projectDeletionTask);
  await expect(diagnostic(page, "Subscription ID")).toContainText(fixtureIds.product);
  await expect(page).toHaveURL(deletionUrl);

  await expect.poll(() => countRequests(request, subject, productPath)).toBe(0);
  // The project the Data Manager could not delete is still there, so nothing local was cleared.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .toContain(fixtureIds.project);

  await page.getByRole("link", { name: "Back to Projects" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
});

test("an uninterpretable progress read stops cleanup and retries only the read", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/project-deletion-task-failure?status=403`);
  await login(page, managePath, testInfo);
  await startDeletion(page);

  const checkAgain = page.getByRole("button", { name: "Check again" });
  await expect(page.getByText(/progress could not be established/u)).toBeVisible();
  await expect.poll(() => countRequests(request, subject, productPath)).toBe(0);

  // A retry the service answers exactly as before returns the caller to the same offer rather than
  // leaving them waiting on a read that has already come back.
  await checkAgain.click();
  await expect(page.getByText(/progress could not be established/u)).toBeVisible();
  await expect(checkAgain).toBeEnabled();
  await expect(page).toHaveURL(deletionUrl);

  // Reading the task again is the one safe request, and it settles the deletion it was describing.
  await request.delete(`${scenario(subject)}/project-deletion-task-failure`);
  await checkAgain.click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`, { timeout: 30_000 });
  await expect.poll(() => countRequests(request, subject, projectPath)).toBe(1);
});

test("a failed subscription cleanup keeps its identity and retries only that phase", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/subscription-mutation-failure?status=503`);
  await login(page, managePath, testInfo);
  await startDeletion(page);

  await expect(
    page.getByText("The subscription service is unavailable. Retry when it has recovered."),
  ).toBeVisible({ timeout: 30_000 });
  await expect(diagnostic(page, "Subscription ID")).toContainText(fixtureIds.product);
  await expect(
    page.getByRole("link", { name: "Open this subscription in Administration" }),
  ).toBeVisible();
  await expect(page).toHaveURL(deletionUrl);
  // The project's own deletion already succeeded, so it is never sent again by this retry.
  await request.delete(`${scenario(subject)}/subscription-mutation-failure`);
  await page.getByRole("button", { name: "Retry subscription deletion" }).click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  await expect.poll(() => countRequests(request, subject, projectPath)).toBe(1);
  await expect.poll(() => countRequests(request, subject, productPath)).toBe(2);
});

// A refused request never becomes a workflow, so it stays where it was made, with the project it
// still describes intact.
for (const [status, reason] of [
  [403, "The server did not allow this project to be deleted. Review your access and retry."],
  [503, "The project service is unavailable. Retry when it has recovered."],
  [400, "fixture-project-deletion-domain-failure"],
] as const) {
  test(`a ${status} deletion response keeps the caller in Manage`, async ({
    page,
    request,
  }, testInfo) => {
    const subject = subjectFor(testInfo);
    await request.post(`${scenario(subject)}/project-deletion-failure?status=${status}`);
    await login(page, managePath, testInfo);
    await startDeletion(page);

    // The refusal is stated where the request was made, and the project underneath is untouched.
    await expect(page.getByText(reason)).toBeVisible();
    await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
    await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
    // No workflow began, so nothing was recorded for a progress route to resume.
    expect(
      await page.evaluate((key) => localStorage.getItem(key), PROJECT_DELETION_RECOVERY_KEY),
    ).toBeNull();

    // The confirmation stays open, so the same deliberate step is the retry once the service answers.
    const confirmation = page.getByRole("dialog");
    await expect(confirmation).toBeVisible();
    await request.delete(`${scenario(subject)}/project-deletion-failure`);
    await confirmation.getByRole("button", { name: "Delete project" }).click();
    await expect(page).toHaveURL(`${acceptanceUrls.app}projects`, { timeout: 30_000 });
    await expect.poll(() => countRequests(request, subject, projectPath)).toBe(2);
  });
}

test("a project viewer is told what deletion requires rather than offered it", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${scenario(subjectFor(testInfo))}?profile=read-only`);
  await login(page, managePath, testInfo);

  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete project" })).toBeDisabled();
  await expect(
    page.getByText("You must be a project administrator to delete this project."),
  ).toBeVisible();
});
