import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const acceptanceResults = `projects/${fixtureIds.project}/results`;
const screeningResults = `projects/${fixtureIds.screeningProject}/results`;
const jobDetail = `${acceptanceResults}/instances/${fixtureIds.instance}`;
const applicationDetail = `${acceptanceResults}/instances/${fixtureIds.applicationInstance}`;
/** The acceptance project's own instance, addressed beneath a project that does not own it. */
const wrongProjectPairing = `${screeningResults}/instances/${fixtureIds.instance}`;

const scenario = (subject: string) => `${acceptanceUrls.control}/scenario/${subject}`;

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(scenario(subjectFor(testInfo)));
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.8.${testInfo.parallelIndex + 1}.${testInfo.line}`,
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

test("a job instance entered directly opens inside the project that owns it", async ({
  page,
}, testInfo) => {
  await login(page, jobDetail, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
  await projectShellIsRetained(page);

  // The instance's own identity, the job it ran, its progress, and what it produced are what the
  // screen is built from.
  await expect(page.getByRole("link", { name: "Acceptance Instance" })).toHaveAttribute(
    "href",
    `/data-manager-ui/${jobDetail}`,
  );
  await expect(page.getByText("Acceptance Job")).toBeVisible();
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByText("Docked poses")).toBeVisible();

  // Every path the instance produced, and its own logs, are files of the project that owns it.
  await expect(page.getByRole("link", { name: "Logs" })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.project}/files?path=%2F.${fixtureIds.instance}`,
  );
  await expect(page.getByRole("link", { name: "Locate file in project" })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.project}/files?path=%2Fresults`,
  );

  await page.getByRole("link", { name: "All results" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByRole("link", { name: "Acceptance Instance" })).toBeVisible();
});

test("an application instance accounts for itself as the application it is", async ({
  page,
}, testInfo) => {
  await login(page, applicationDetail, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${applicationDetail}`);
  await projectShellIsRetained(page);
  await expect(page.getByRole("link", { name: "Acceptance Notebook" })).toHaveAttribute(
    "href",
    `/data-manager-ui/${applicationDetail}`,
  );
  await expect(page.getByText("acceptance-application").first()).toBeVisible();

  // Only an application exposes a URL of its own, and only a job has a definition to run again or
  // logs of its own, so neither kind is offered what the other's identity would be needed for.
  await expect(page.getByRole("link", { name: "Open" })).toHaveAttribute(
    "href",
    "https://notebook.example.org/acceptance",
  );
  await expect(page.getByRole("button", { name: "Run again" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Logs" })).toHaveCount(0);
  // Its own actions still answer to the project that owns it.
  await expect(page.getByRole("button", { name: "Archive" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
});

test("each lifecycle an instance can reach is told apart, and none of them is assumed", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/instance-stage?stage=running`);
  await login(page, jobDetail, testInfo);

  // Still running: nothing has finished, so what the control would take away is running work.
  await expect(page.getByText("This instance is still running.")).toBeVisible();
  await expect(page.getByText("Running", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Terminate" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);

  // Finished with a failed phase: the Data Manager's own statement that the work failed.
  await request.post(`${scenario(subject)}/instance-stage?stage=failed`);
  await page.reload();
  await expect(page.getByText("The job image exited with code 4.")).toBeVisible();
  await expect(page.getByText("Failed", { exact: true })).toBeVisible();

  // Finished with a successful phase but a recorded error: the case a phase alone would read as
  // completed work. It is reported as the failure it is, in the words the instance gave.
  await request.post(`${scenario(subject)}/instance-stage?stage=rejected`);
  await page.reload();
  await expect(page.getByText("The job wrote none of its outputs.")).toBeVisible();
  await expect(page.getByText("Failed", { exact: true })).toBeVisible();

  // An instance the cluster could not start has neither run nor finished, and is reported as
  // neither. It is still in the cluster, so what it offers is a stop.
  await request.post(`${scenario(subject)}/instance-stage?stage=stalled`);
  await page.reload();
  await expect(
    page.getByText("This instance's image could not be pulled, so it has not started."),
  ).toBeVisible();
  await expect(page.getByText("Not progressing")).toBeVisible();
  await expect(page.getByRole("button", { name: "Terminate" })).toBeEnabled();

  // A phase this client cannot place establishes nothing: it is neither running work nor a
  // finished result, so neither is offered to be taken away.
  await request.post(`${scenario(subject)}/instance-stage?stage=unrecognised`);
  await page.reload();
  await expect(
    page.getByText("This instance's progress could not be established. Retry to check it again."),
  ).toBeVisible();
  await expect(page.getByText("Not established")).toBeVisible();
  await expect(page.getByRole("button", { name: "Terminate" })).toBeDisabled();
  await expect(
    page.getByText(
      "This instance's progress could not be established, so stopping or deleting it cannot be established as safe.",
    ),
  ).toBeVisible();
  // Archiving is reversible and protects the instance rather than changing it, so it is not
  // withheld along with the request that would destroy it.
  await expect(page.getByRole("button", { name: "Archive" })).toBeEnabled();

  // Finished cleanly: the only outcome that reads as success, and the one named as a result.
  await request.post(`${scenario(subject)}/instance-stage?stage=done`);
  await page.reload();
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
});

test("an instance opened from its project's list shows the same instance's own read", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/instance-stage?stage=failed`);
  await login(page, acceptanceResults, testInfo);

  const instanceCard = page
    .locator(".MuiCard-root")
    .filter({ has: page.getByRole("link", { name: "Acceptance Instance" }) });
  await instanceCard.getByRole("button", { name: "Show more" }).click();

  // The listed card reads the instance it lists through the same owner its own route reads it
  // through, so the outcome it shows is the outcome the detail route shows.
  await expect(page.getByText("The job image exited with code 4.")).toBeVisible();
  await expect(page.getByText("Docked poses")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
});

test("refreshing the section refreshes the instance the URL addresses", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/instance-stage?stage=running`);
  await login(page, jobDetail, testInfo);
  await expect(page.getByText("This instance is still running.")).toBeVisible();

  await request.post(`${scenario(subject)}/instance-stage?stage=done`);
  await page.getByRole("button", { name: "Refresh results" }).click();

  // The addressed instance is refreshed under the project that owns it, in place.
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByText("This instance is still running.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
});

test("an instance still working is asked about again without the caller doing anything", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/instance-stage?stage=running`);
  await login(page, jobDetail, testInfo);
  await expect(page.getByText("This instance is still running.")).toBeVisible();

  // Nothing is clicked: an instance the Data Manager still reports as working is polled, so the
  // outcome it reaches arrives on its own, in the project and on the route the caller is already on.
  await request.post(`${scenario(subject)}/instance-stage?stage=done`);
  await expect(page.getByText("Succeeded")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("This instance is still running.")).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
});

test("an instance whose progress cannot be read is not reported as finished", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/instance-stage?stage=running`);
  await login(page, jobDetail, testInfo);
  await expect(page.getByText("This instance is still running.")).toBeVisible();

  // The instance keeps running while its own read starts failing. What it last showed stays on
  // screen, and the read that failed is reported as exactly that rather than as an outcome.
  await request.post(`${scenario(subject)}/instance-failure?status=503`);
  await page.getByRole("button", { name: "Refresh results" }).click();

  await expect(
    page.getByText("This result could not be loaded. Retry it without leaving this project."),
  ).toBeVisible();
  await expect(page.getByText("Succeeded")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Acceptance Instance" })).toBeVisible();
  // Content this client could not refresh cannot be established as safe to change.
  await expect(page.getByRole("button", { name: "Terminate" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Archive" })).toBeDisabled();
  await expect(
    page
      .getByText(
        "This result could not be refreshed, so changing it cannot be established as safe.",
      )
      .first(),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);

  // Once the read answers again the instance accounts for itself in place.
  await request.delete(`${scenario(subject)}/instance-failure`);
  await request.post(`${scenario(subject)}/instance-stage?stage=done`);
  await page.getByRole("button", { name: "Retry" }).first().click();
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
});

test("a project viewer reads an instance and is told what changing it requires", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${scenario(subjectFor(testInfo))}?profile=read-only`);
  await login(page, jobDetail, testInfo);

  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByText("Docked poses")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Archive" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Run again" })).toBeDisabled();
  await expect(
    page.getByText(
      "You must be a project editor or administrator to stop or delete instances in this project.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "You must be a project editor or administrator to archive instances in this project.",
    ),
  ).toBeVisible();
});

test("a rejected instance command preserves the project and route it was rejected in", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/instance-command-failure?status=403`);
  await login(page, jobDetail, testInfo);
  await expect(page.getByText("Succeeded")).toBeVisible();

  // A refused archive is authorisation feedback alone: the instance is unchanged and still says
  // what it is.
  await page.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("fixture-forbidden")).toBeVisible();
  await expect(page.getByRole("button", { name: "Archive" })).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete Instance" })
    .getByRole("button", { name: "Delete" })
    .click();

  // The Data Manager's own account of the refusal is reported where the instance is, and nothing
  // about the caller's scope changes: same project, same route, same instance.
  await expect(page.getByText("fixture-forbidden").first()).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
  await projectShellIsRetained(page);
  await expect(page.getByRole("link", { name: "Acceptance Instance" })).toBeVisible();
  await expect(page.getByText("Succeeded")).toBeVisible();
});

test("archiving protects the instance it addressed and says what it became", async ({
  page,
}, testInfo) => {
  await login(page, jobDetail, testInfo);
  await expect(page.getByText("Succeeded")).toBeVisible();

  await page.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("Instance has been archived")).toBeVisible();
  await expect(page.getByRole("button", { name: "Unarchive" })).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);

  // The project's own collection reports the instance the command changed, and only that one.
  await page.getByRole("link", { name: "All results" }).click();
  const instanceCard = page
    .locator(".MuiCard-root")
    .filter({ has: page.getByRole("link", { name: "Acceptance Instance" }) });
  await expect(instanceCard.getByRole("button", { name: "Unarchive" })).toBeVisible();
  const applicationCard = page
    .locator(".MuiCard-root")
    .filter({ has: page.getByRole("link", { name: "Acceptance Notebook" }) });
  await expect(applicationCard.getByRole("button", { name: "Archive" })).toBeVisible();

  // Giving the protection up again is the same command in reverse, and it addresses the same
  // instance from the list its project keeps it in.
  await instanceCard.getByRole("button", { name: "Unarchive" }).click();
  await expect(page.getByText("Instance has been unarchived")).toBeVisible();
  await expect(instanceCard.getByRole("button", { name: "Archive" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
});

test("terminating running work removes it from the project that owned it", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/instance-stage?stage=running`);
  await login(page, jobDetail, testInfo);
  await expect(page.getByText("This instance is still running.")).toBeVisible();

  await page.getByRole("button", { name: "Terminate" }).click();
  await page
    .getByRole("dialog", { name: "Terminate Instance" })
    .getByRole("button", { name: "Terminate" })
    .click();

  // The Data Manager takes the instance away whichever word the control used, so the caller is
  // returned to the list of the project that owned it rather than left on a route with nothing at
  // the end of it.
  await expect(page.getByText("Instance has been terminated")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await projectShellIsRetained(page);
  await expect(page.getByRole("link", { name: "Acceptance Instance" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Acceptance Notebook" })).toBeVisible();
});

test("a removed instance returns the caller to the list of the project that owned it", async ({
  page,
}, testInfo) => {
  await login(page, jobDetail, testInfo);
  await expect(page.getByText("Succeeded")).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete Instance" })
    .getByRole("button", { name: "Delete" })
    .click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await projectShellIsRetained(page);
  // The project's own instance collection no longer lists it, and the other results are untouched.
  await expect(page.getByRole("link", { name: "Acceptance Instance" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Acceptance Notebook" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Acceptance Workflow" })).toBeVisible();
});

test("an instance paired with a project that does not own it is not found there", async ({
  page,
}, testInfo) => {
  await login(page, wrongProjectPairing, testInfo);

  // Local not-found: no redirect, no discovery of the real owner, and the addressed project stays.
  await expect(page.getByText("This result was not found in this project.")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${wrongProjectPairing}`);
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();
  // Nothing about the instance, what it produced, or its owning project is revealed by the pairing.
  await expect(page.getByText("Docked poses")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Acceptance Instance" })).toHaveCount(0);
  await expect(page.getByText("Acceptance Project", { exact: true })).toHaveCount(0);

  // Back and Forward restore exactly what each entry addressed.
  await page.goto(jobDetail);
  await expect(page.getByText("Succeeded")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${wrongProjectPairing}`);
  await expect(page.getByText("This result was not found in this project.")).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
  await expect(page.getByRole("link", { name: "Acceptance Instance" })).toBeVisible();
});

test("a refused or missing instance read answers exactly as an absent one does", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/instance-failure?status=403`);
  await login(page, jobDetail, testInfo);

  // A refusal and an absence are the same non-disclosing outcome, and neither of them is allowed
  // to take the project the caller is in away from them.
  for (const status of [403, 404]) {
    await request.post(`${scenario(subject)}/instance-failure?status=${status}`);
    await page.reload();

    await expect(page.getByText("This result was not found in this project.")).toBeVisible();
    await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
    await projectShellIsRetained(page);
    await expect(page.getByText("Docked poses")).toHaveCount(0);
  }

  // Restored access shows the instance again without any change of scope.
  await request.delete(`${scenario(subject)}/instance-failure`);
  await page.reload();
  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
});

test("an instance read that merely failed is retried without leaving the project", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/instance-failure?status=503`);
  await login(page, jobDetail, testInfo);

  // A transport failure says nothing about the instance, so it is offered for retry rather than
  // reported as an absence.
  await expect(
    page.getByText("This result could not be loaded. Retry it without leaving this project."),
  ).toBeVisible();
  await expect(page.getByText("This result was not found in this project.")).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
  await projectShellIsRetained(page);

  await request.delete(`${scenario(subject)}/instance-failure`);
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByText("Succeeded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
});
