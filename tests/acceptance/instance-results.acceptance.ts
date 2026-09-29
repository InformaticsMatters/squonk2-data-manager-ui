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

const jobRerun = `${jobDetail}?rerun=1`;
/** The rerun of the acceptance project's own instance, addressed beneath a project that does not
 * own it. */
const wrongProjectRerun = `${wrongProjectPairing}?rerun=1`;

const scenario = (subject: string) => `${acceptanceUrls.control}/scenario/${subject}`;

/** One create-instance command, in the fields the generated body carries. */
type InstanceLaunch = { as_name: string; project_id: string; specification: string };

type Requester = { get: (url: string) => Promise<{ json: () => Promise<unknown> }> };

/**
 * Every create-instance command the Data Manager received, which is what a rerun actually is. The
 * project each one names is read from the body that was sent rather than from what it created, so
 * a rerun that named the wrong project would be visible here even if nothing on screen was.
 */
const instanceLaunches = async (request: Requester, subject: string) =>
  (
    (await request.get(scenario(subject)).then((response) => response.json())) as {
      instanceLaunches: InstanceLaunch[];
    }
  ).instanceLaunches;

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
  // What read-only access withholds is a fact of the project, so the section states it once above
  // the result rather than once per withheld control.
  await expect(
    page.getByText(
      "You have read-only access to this project, so you cannot run, stop, delete, or archive work in it.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("You must be a project editor or administrator", { exact: false }),
  ).toHaveCount(0);
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

test("a rerun opens as a route of the instance, prefilled with what that instance ran", async ({
  page,
}, testInfo) => {
  await login(page, jobDetail, testInfo);
  await expect(page.getByText("Succeeded")).toBeVisible();

  // Opening the rerun pushes history and is directly linkable, and the instance stays beneath it.
  await page.getByRole("button", { name: "Run again" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobRerun}`);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("acceptance • version 1.0.0")).toBeVisible();
  // The instance carries what it was run with, so the rerun starts from exactly that.
  await expect(dialog.getByLabel("Batch size")).toHaveValue("250");
  // The instance and the project that owns it are still beneath the rerun opened over them.
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Docked poses")).toBeVisible();

  // Back leaves the rerun and restores the instance it was opened over.
  await dialog.getByLabel("Batch size").fill("777");
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Succeeded")).toBeVisible();

  // Forward reopens the same instance's own rerun, and it opens afresh: leaving the rerun's route
  // ends the attempt it held, so what an abandoned attempt had typed is not carried back into the
  // next one. A reopened rerun therefore always states what the instance itself was run with.
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobRerun}`);
  await expect(dialog.getByLabel("Batch size")).toHaveValue("250");

  // Close replaces the rerun with the instance, so Back does not reopen it.
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a rerun entered directly runs the instance's job in the project that owns it", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, jobRerun, testInfo);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Job name").fill("rerun-of-acceptance-instance");
  await dialog.getByLabel("Batch size").fill("500");
  await page.getByRole("button", { name: "Run", exact: true }).click();

  // A launch is reported only once the Data Manager has accepted it, so what this opens is an
  // instance that exists — at its own canonical Results route, inside the project that ran it.
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.launchedInstance}`,
  );
  await projectShellIsRetained(page);

  // The command named the project the URL verified the instance against, and carried the rerun's
  // own edit of what that instance was run with.
  const launches = await instanceLaunches(request, subject);
  expect(launches).toHaveLength(1);
  expect(launches[0].project_id).toBe(fixtureIds.project);
  expect(launches[0].as_name).toBe("rerun-of-acceptance-instance");
  expect(JSON.parse(launches[0].specification).variables).toMatchObject({ batchSize: 500 });

  // The project's own instance collection was refreshed by the launch, so the list the caller
  // returns to already holds what the rerun created.
  await page.getByRole("link", { name: "All results" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceResults}`);
  await expect(page.getByRole("link", { name: "rerun-of-acceptance-instance" })).toBeVisible();
});

test("an answered rerun leaves no rerun behind for Back to run again", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, `${acceptanceResults}?search=Acceptance+Instance`, testInfo);

  // The rerun is reached from the list, so the list's own state is what it carries.
  const instanceCard = page
    .locator(".MuiCard-root")
    .filter({ has: page.getByRole("link", { name: "Acceptance Instance" }) });
  await instanceCard.getByRole("button", { name: "Run again" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${jobDetail}?search=Acceptance+Instance&rerun=1`,
  );
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("button", { name: "Run", exact: true }).click();
  // The created instance is opened with the list state the rerun was carrying, so returning to the
  // list lands on the list the caller came from.
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.launchedInstance}?search=Acceptance+Instance`,
  );

  // An answered rerun has spent its route. Back therefore reaches the instance it was opened over,
  // never a rerun of work that has just been run, so the same work cannot be run twice by going
  // back and pressing Run again.
  await page.goBack();
  await expect(page).not.toHaveURL(/rerun=1/u);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await instanceLaunches(request, subject)).toHaveLength(1);
});

test("a rerun addressed beneath a project that does not own the instance runs nothing", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, wrongProjectRerun, testInfo);

  // The pairing is the same non-disclosing not-found it is without the rerun, so a URL asking for
  // a rerun cannot compose one the instance beneath it would not offer.
  await expect(page.getByText("This result was not found in this project.")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Run", exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${wrongProjectRerun}`);
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  // Nothing about the instance or the project that really owns it is revealed by the pairing.
  await expect(page.getByText("Acceptance Project", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Docked poses")).toHaveCount(0);
  expect(await instanceLaunches(request, subject)).toHaveLength(0);
});

test("an application instance is offered no rerun, and its route cannot invent one", async ({
  page,
}, testInfo) => {
  await login(page, `${applicationDetail}?rerun=1`, testInfo);

  // An application names no job definition to run again, so the instance is presented exactly as
  // it is and nothing is opened over it.
  await expect(page.getByRole("link", { name: "Acceptance Notebook" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run again" })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a project viewer is told what running an instance's job again requires", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${scenario(subjectFor(testInfo))}?profile=read-only`);
  await login(page, jobDetail, testInfo);

  // The rerun answers to the project that owns the instance, so a caller who may not run work
  // there is told so rather than being offered a launch the Data Manager would refuse.
  await expect(page.getByRole("button", { name: "Run again" })).toBeDisabled();
  await expect(
    page.getByText(
      "You have read-only access to this project, so you cannot run, stop, delete, or archive work in it.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);

  // Entering the rerun route directly is the case the control could not withhold. The form opens
  // and states what it was run with, because reading an instance is not the thing being withheld —
  // but the same capability decides the launch, so nothing can be sent from it.
  await page.goto(jobRerun);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Batch size")).toHaveValue("250");
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  // The dialog covers the page's own read-only alert, so it states what the launch requires itself.
  await expect(
    dialog.getByText("You must be a project editor or administrator to run work in this project."),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobRerun}`);
});

test("a refused rerun is withheld and a failed one stays sendable in place", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/launch-failure?status=403`);
  await login(page, jobRerun, testInfo);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Batch size").fill("750");

  // The Data Manager is the authorization authority, so its refusal is feedback about this one
  // rerun: it is withheld rather than invited again, and nothing about the instance or the project
  // it was refused in changes.
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    dialog.getByText(
      "The Data Manager did not allow this to be run in this project. Nothing was launched, and the displayed project and its catalogue have not changed.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeDisabled();
  await expect(dialog.getByLabel("Batch size")).toHaveValue("750");
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobRerun}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Docked poses")).toBeVisible();

  // Reopening the rerun answers afresh: the refusal answered one attempt, not the instance.
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobDetail}`);
  await page.getByRole("button", { name: "Run again" }).click();
  await expect(
    dialog.getByText("The Data Manager did not allow this to be run in this project."),
  ).toHaveCount(0);

  // A transport fact decides no authority, so every one of them keeps the rerun sendable with
  // everything entered still in it.
  await dialog.getByLabel("Batch size").fill("900");
  for (const status of [503, 429]) {
    await request.post(`${scenario(subject)}/launch-failure?status=${status}`);
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(
      dialog.getByText(
        "This launch could not be completed, so nothing was launched. The definition and everything entered have been kept, so it can be sent again.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();
    await expect(dialog.getByLabel("Batch size")).toHaveValue("900");
    await expect(page).toHaveURL(`${acceptanceUrls.app}${jobRerun}`);
  }

  // A refusal of what was entered is the caller's to correct, in the service's own words.
  await request.post(`${scenario(subject)}/launch-failure?status=400`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    dialog.getByText("fixture-rejected: the file type is not supported by this project"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled();

  // Sending it again once the service recovers opens the instance that was finally created, and
  // every attempt was one request and no more.
  await request.delete(`${scenario(subject)}/launch-failure`);
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.launchedInstance}`,
  );
  const launches = await instanceLaunches(request, subject);
  expect(launches).toHaveLength(5);
  expect(launches.every(({ project_id }) => project_id === fixtureIds.project)).toBe(true);
});

test("a rerun in flight cannot be sent a second time", async ({ page, request }, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${scenario(subject)}/launch-delay?milliseconds=3000`);
  await login(page, jobRerun, testInfo);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Sent twice in one gesture, before any answer and before the control could have been redrawn.
  await page.getByRole("button", { name: "Run", exact: true }).dblclick();
  await expect(
    dialog.getByText(
      "This launch has been sent. It cannot be sent again until the Data Manager answers it.",
    ),
  ).toBeVisible();
  // The Data Manager creates an instance per request it accepts, so two submissions of one rerun
  // would run the same work twice.
  expect(await instanceLaunches(request, subject)).toHaveLength(1);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${jobRerun}`);

  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${acceptanceResults}/instances/${fixtureIds.launchedInstance}`,
  );
  expect(await instanceLaunches(request, subject)).toHaveLength(1);
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
