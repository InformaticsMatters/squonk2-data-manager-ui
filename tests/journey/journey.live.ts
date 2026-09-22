import { expect, type Page, test } from "@playwright/test";
import path from "node:path";

import { passwordFor } from "../liveEnvironment";
import { login } from "../login";
import { journeyCollaborators, journeyDeployment, journeyUser } from "./deployment";
import { accessTokenFor, dataManager } from "./services";

const upload = path.resolve(__dirname, "../fixtures/poses.sdf");

/** What the journey calls the work it starts, so anything it leaves behind is recognisable. */
const runNames = {
  application: "live-journey-application",
  job: "live-journey-job",
  workflow: "live-journey-workflow",
};

/** The list a role is added through is that role's own plural, as the People section labels it. */
const membershipList = (role: string) => `${role[0].toUpperCase()}${role.slice(1)}s`;

/**
 * The application instance the journey launched, so a run that fails before terminating it does
 * not leave a notebook spending the subscription's coins. Terminating it directly is the one thing
 * the journey does outside the application it is testing.
 */
let launchedApplication: string | undefined;

/** The section strip a project carries, which is how the journey moves around inside one. */
const projectSection = (page: Page, label: string) =>
  page.getByRole("navigation", { name: "Project" }).getByRole("link", { name: label, exact: true });

/**
 * Finds one definition in the Run catalogue and opens its launch dialog.
 *
 * The catalogue re-renders as the search narrows it, and the row being searched for is on screen
 * before that has happened — so the launch link is waited for as the only one left, rather than
 * clicked while the list underneath it is still moving.
 */
const launch = async (page: Page, definition: string) => {
  await projectSection(page, "Run").click();
  await page.getByRole("textbox", { name: "Search" }).fill(definition);
  await expect(page.getByRole("link", { name: /^Run /u })).toHaveCount(1);
  await page.getByRole("link", { name: `Run ${definition}`, exact: true }).click();
  return page.getByRole("dialog");
};

/**
 * Re-reads the page until the services have caught up with what was asked of them.
 *
 * The re-read is a reload rather than the page's own refresh control, because this journey outlives
 * the deployment's five-minute access token. The application asks for one as it starts up, and a
 * page left open past that point reports a lapsed session instead of the work, so loading it again
 * is both how the journey waits and how it signs back in. Every step after the sign-in starts the
 * same way.
 */
const settles = async (page: Page, expectation: () => Promise<void>, timeout: number) =>
  expect(async () => {
    await page.reload();
    await expectation();
  }).toPass({ intervals: [3000], timeout });

/** A step that starts from a freshly loaded page, and so from a session that has just been read. */
const journeyStep = async (title: string, page: Page, body: () => Promise<void>) =>
  test.step(title, async () => {
    await page.reload();
    await body();
  });

/**
 * One new user's whole working life against a live deployment: onboarding, execution, membership,
 * billing and deletion, in the order a person meets them. Every step stands on the one before it,
 * so they share a context and a sign-in rather than rebuilding the prefix eleven times, and the
 * run is never retried — a second attempt would start from the first attempt's leftovers.
 *
 * This is not a merge gate. What each screen does is specified deterministically in
 * `tests/acceptance`; this run is the only evidence that a real Data Manager and Account Server
 * still carry the whole of it.
 */
test("a new user is onboarded, runs work, shares it, is billed for it and clears up", async ({
  page,
}) => {
  await test.step("signs in and is offered a unit of their own", async () => {
    await page.goto("projects");
    await login(page, journeyUser);
    await page.waitForURL("**/projects");
    await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Start working in a project of your own" }),
    ).toBeVisible();
  });

  await journeyStep("creates the personal unit that will pay for the work", page, async () => {
    await page.getByRole("button", { name: "Create personal unit" }).click();
    await expect(
      page.getByText(`You already have a personal unit, ${journeyUser.username}`),
    ).toBeVisible();
  });

  await journeyStep("creates a project, taking out its subscription", page, async () => {
    // The onboarding link carries the new unit, so the project is created in the unit just made.
    await page.locator('a[href*="/projects/new?unit="]').click();
    await expect(page.getByRole("heading", { level: 1, name: "Create project" })).toBeVisible();

    await page.getByRole("textbox", { name: "Project name" }).fill(journeyDeployment.projectName);
    await page.getByRole("combobox", { name: "Tier" }).click();
    await page.getByRole("option", { name: journeyDeployment.tier, exact: true }).click();
    await page.getByRole("button", { name: "Create project" }).click();

    await page.waitForURL("**/projects/project-*/files", { timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Files" })).toBeVisible();
  });

  await journeyStep("uploads a file into the project", page, async () => {
    await page.getByRole("button", { name: "Upload unmanaged file" }).click();
    await page.locator('input[type="file"]').setInputFiles(upload);
    await expect(page.getByRole("button", { exact: true, name: "poses.sdf" }).first()).toBeVisible({
      timeout: 120_000,
    });
  });

  await journeyStep("runs a job and follows it to the end", page, async () => {
    const dialog = await launch(page, journeyDeployment.job);
    await dialog.getByRole("textbox", { name: "Job name" }).fill(runNames.job);
    await dialog.getByRole("button", { name: "Run", exact: true }).click();

    await page.waitForURL("**/results/instances/instance-*", { timeout: 60_000 });
    await settles(
      page,
      async () => {
        await expect(page.getByText("COMPLETED", { exact: true })).toBeVisible({ timeout: 2000 });
        await expect(page.getByText("Succeeded", { exact: true })).toBeVisible({ timeout: 2000 });
      },
      300_000,
    );
  });

  await journeyStep("runs a workflow and follows every step to the end", page, async () => {
    const dialog = await launch(page, journeyDeployment.workflow);
    await dialog.getByRole("textbox", { name: "Workflow name" }).fill(runNames.workflow);
    await dialog.getByRole("button", { name: "Run", exact: true }).click();

    await page.waitForURL("**/results/workflows/r-workflow-*", { timeout: 60_000 });
    await settles(
      page,
      async () => {
        // The workflow's own phase, which is exactly "SUCCESS" — a step that has already succeeded
        // says "Status: SUCCESS" long before the workflow itself is over.
        await expect(page.getByText("SUCCESS", { exact: true })).toBeVisible({ timeout: 2000 });
        await expect(page.getByText("Succeeded", { exact: true })).toBeVisible({ timeout: 2000 });
      },
      600_000,
    );
    await expect(page.getByRole("heading", { name: "Workflow Steps" })).toBeVisible();
    await expect(page.getByText("Status: SUCCESS").first()).toBeVisible();
  });

  await journeyStep("launches an application and terminates it again", page, async () => {
    const dialog = await launch(page, journeyDeployment.application);
    await dialog.getByRole("textbox", { name: "Instance Name" }).fill(runNames.application);
    await dialog.getByRole("button", { name: "Run", exact: true }).click();

    await page.waitForURL("**/results/instances/instance-*", { timeout: 60_000 });
    launchedApplication = new URL(page.url()).pathname.split("/").pop();

    // A running notebook spends coins for as long as it lives, so it is asserted to be running and
    // nothing more, and then it is terminated.
    await settles(
      page,
      async () => {
        await expect(page.getByText("RUNNING", { exact: true })).toBeVisible({ timeout: 2000 });
        await expect(page.getByRole("link", { name: "Open" })).toBeVisible({ timeout: 2000 });
      },
      300_000,
    );

    await page.getByRole("button", { name: "Terminate" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Terminate" }).click();
    await page.waitForURL("**/results", { timeout: 60_000 });
    await expect(page.getByRole("link", { name: runNames.application })).toHaveCount(0);
    launchedApplication = undefined;
  });

  await journeyStep(
    "shares the project with its collaborators, and withdraws one",
    page,
    async () => {
      await projectSection(page, "Manage").click();
      await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();

      for (const { role, username } of journeyCollaborators) {
        const list = membershipList(role);
        await page.getByRole("combobox", { name: list }).fill(username);
        await page.getByRole("option", { exact: true, name: username }).click();
        await expect(
          page.getByText(`${username} is now an ${role} of this project.`),
        ).toBeVisible();
      }

      const [withdrawn] = journeyCollaborators;
      await page
        .getByRole("region", { name: membershipList(withdrawn.role) })
        .getByLabel(`Remove ${withdrawn.username}`, { exact: true })
        .click();
      await expect(
        page.getByText(`${withdrawn.username} is no longer an ${withdrawn.role} of this project.`),
      ).toBeVisible();
    },
  );

  await journeyStep("reads the ledger the work was charged to", page, async () => {
    await page.getByRole("link", { name: "View charges" }).click();
    // "Charges" exactly: the ledger's own sections are headings too, and a cycle that has settled
    // adds a total, so a loose name matches more of the page the longer the journey has run.
    await expect(page.getByRole("heading", { exact: true, name: "Charges" })).toBeVisible();

    // Whether a charge has settled minutes after the work ran is billing timing, not this
    // application's behaviour, so the ledger is asserted to render, not to hold rows.
    await expect(page.getByText("Billed to:")).toBeVisible();
    await expect(page.getByText(journeyUser.username).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Processing charges" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Storage charges" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Billing cycle" })).toBeVisible();
  });

  await journeyStep("deletes the project, and with it the subscription", page, async () => {
    await page.getByRole("link", { name: "Subscription", exact: true }).click();
    await page.getByRole("link", { name: "Manage this project" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();

    await page.getByRole("button", { name: "Delete project" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete project" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Deleting project" })).toBeVisible();

    // The Data Manager deletes every instance the project ran before the project itself goes, and
    // only then does this page remove the subscription and return the caller to their projects.
    // That wait outlives an access token, so the page is re-read — it is built to be re-opened
    // while the deletion it follows is still running — but each read is given a whole minute to
    // finish the job rather than being restarted underneath itself.
    await settles(
      page,
      async () => {
        await expect(page).toHaveURL(/\/projects$/u, { timeout: 60_000 });
      },
      900_000,
    );
    await expect(
      page.getByRole("link", { name: new RegExp(journeyDeployment.projectName, "u") }),
    ).toHaveCount(0);
  });

  await journeyStep("deletes the personal unit it all lived in", page, async () => {
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Administration" })
      .click();
    const units = page.getByRole("list", { name: "Units" });
    await units.getByRole("link", { name: new RegExp(`^${journeyUser.username}`, "u") }).click();
    // The project took its subscription with it, so the unit it was billed to now holds nothing.
    await page.getByRole("link", { name: "Subscriptions", exact: true }).click();
    await expect(page.getByText("This unit holds no subscriptions.")).toBeVisible();

    await page.getByRole("link", { name: "Access", exact: true }).click();
    await page.getByRole("button", { name: "Delete unit" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();

    await page.waitForURL("**/administration", { timeout: 60_000 });
    await expect(
      units.getByRole("link", { name: new RegExp(`^${journeyUser.username}`, "u") }),
    ).toHaveCount(0);
  });
});

test.afterAll(async () => {
  if (launchedApplication === undefined) {
    return;
  }
  // The journey never reached its own termination step, and a notebook left running keeps
  // spending. This is the only cost a failed run is not allowed to leave behind as evidence.
  const token = await accessTokenFor(journeyUser.username, passwordFor(journeyUser) as string);
  await fetch(`${dataManager()}/instance/${launchedApplication}`, {
    headers: { authorization: `Bearer ${token}` },
    method: "DELETE",
  });
});
