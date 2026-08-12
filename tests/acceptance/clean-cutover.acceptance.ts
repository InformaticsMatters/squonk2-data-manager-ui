import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { APPLICATION_ORGANISATION_STORAGE_KEY } from "../../src/application/applicationIdentity";
import { DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY } from "../../src/datasets/uploadBilling";
import { RECENT_PROJECTS_STORAGE_KEY } from "../../src/projects/recentProjects";
import { removedRoutePaths } from "../removedRoutes";
import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}`);
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.9.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

const storedValues = (page: Page) =>
  page.evaluate(() => ({
    local: Object.fromEntries(
      Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]),
    ),
    session: Object.fromEntries(
      Object.keys(sessionStorage).map((key) => [key, sessionStorage.getItem(key)]),
    ),
  }));

/**
 * The same set the pure contract matrix parses, addressed at identities the fixtures really hold.
 * A clean cutover means each one is the application's ordinary not-found: no redirect, no query
 * translation, and no scope inferred from the identity the old URL happened to carry.
 */
const removedRoutes = removedRoutePaths({
  dataset: fixtureIds.dataset,
  instance: fixtureIds.instance,
  organisation: fixtureIds.organisation,
  product: fixtureIds.product,
  project: fixtureIds.project,
  task: fixtureIds.resultTask,
  unit: fixtureIds.unit,
  workflow: fixtureIds.runningWorkflow,
});

test("primary navigation reaches the three landing routes and copies no state between them", async ({
  page,
}, testInfo) => {
  // The caller arrives carrying state every workspace once copied forward, so any of it appearing
  // in a later URL would be the old query propagation surviving the cutover.
  await login(page, `projects/${fixtureIds.project}/results?search=kinase&type=task`, testInfo);
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}projects/${fixtureIds.project}/results?search=kinase&type=task`,
  );

  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Datasets" })
    .click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets`);
  await expect(page.getByRole("heading", { name: "Datasets" })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Administration" })
    .click();
  // Administration always lands on its first task rather than the one last visited.
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/organisation-access`);
  await expect(page.getByRole("heading", { name: "Organisation & access" })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Project" })
    .click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  // Re-entering the project enters its Files root, not the Results state the session started with.
  await page.getByRole("link", { name: /Acceptance Project/u }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/files`);
  await page
    .getByRole("navigation", { name: "Project" })
    .getByRole("link", { name: "Results" })
    .click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/results`);
  await expect(page.getByLabel(/Search/u)).toHaveValue("");
});

test("no Settings entry point survives anywhere in the authenticated shell", async ({
  page,
}, testInfo) => {
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);

  await expect(page.getByRole("button", { name: "Settings" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Main" })).not.toContainText("Settings");

  // The account menu was the Settings modal's own entry point; it now offers account controls only.
  await page.locator('[aria-label="Account"] button').click();
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Settings" })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: /Settings/u })).toHaveCount(0);
});

test("every removed route is the ordinary not-found, with no redirect or inferred scope", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, "projects", testInfo);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  // The requests made while reaching the removed routes are read afterwards, so a route that
  // silently resolved the identity in its query string would be visible as a read that happened.
  await request.put(`${acceptanceUrls.control}/scenario/${subject}`);

  for (const removed of removedRoutes) {
    await page.goto(removed);
    await expect(page.getByRole("heading", { name: "404" }), removed).toBeVisible();
    // The URL is answered where it was asked for: no correction and no canonical alias.
    await expect(page, removed).toHaveURL(`${acceptanceUrls.app}${removed}`);
    await expect(page.getByRole("navigation", { name: "Project" }), removed).toHaveCount(0);
  }

  const diagnostics = (await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json())) as { requests: { path: string }[] };
  // Nothing beneath a removed route resolved the resource its old query string named.
  expect(diagnostics.requests.map(({ path }) => path)).not.toContain(
    `/project/${fixtureIds.project}`,
  );
});

test("legacy scope keys are deleted at bootstrap while unrelated preferences survive", async ({
  page,
}, testInfo) => {
  await login(page, "projects", testInfo);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  // The state a returning caller from before the cutover would still be carrying.
  await page.evaluate(() => {
    localStorage.setItem(
      "data-manager-ui-current-project",
      JSON.stringify({ projectId: "project-33333333-3333-3333-3333-333333333333", version: 1 }),
    );
    localStorage.setItem(
      "data-manager-ui-selected-files",
      JSON.stringify({
        "project-33333333-3333-3333-3333-333333333333": [{ path: "a", type: "file" }],
      }),
    );
    localStorage.setItem("data-manager-ui-cookie-consent", JSON.stringify({ analytics: true }));
    localStorage.setItem("data-manager-ui-event-debug-mode", JSON.stringify({ debug: true }));
    localStorage.setItem("unrelated-device-preference", "kept");
  });

  await page.reload();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  await expect
    .poll(async () => Object.keys((await storedValues(page)).local).toSorted())
    .toEqual(
      expect.not.arrayContaining([
        "data-manager-ui-current-project",
        "data-manager-ui-selected-files",
      ]),
    );
  const { local } = await storedValues(page);
  // Only the organisation is persisted as domain identity; the rest is the browser's own.
  expect(local["data-manager-ui-cookie-consent"]).toBe('{"analytics":true}');
  expect(local["data-manager-ui-event-debug-mode"]).toBe('{"debug":true}');
  expect(local["unrelated-device-preference"]).toBe("kept");
  expect(local[APPLICATION_ORGANISATION_STORAGE_KEY]).toContain(fixtureIds.organisation);

  // A removed key cannot restore scope: the project index is entered, not a remembered project.
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  await expect(page.getByRole("navigation", { name: "Project" })).toHaveCount(0);
});

test("logging out forgets what was remembered for the account and nothing else", async ({
  page,
}, testInfo) => {
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  // Entering the project is what records it as recent, so the history exists to be cleared.
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .toContain(fixtureIds.project);

  await page.evaluate(
    ([billingKey]) => {
      localStorage.setItem(billingKey, JSON.stringify({ unitId: "unit-1", version: 1 }));
      localStorage.setItem("data-manager-ui-cookie-consent", JSON.stringify({ analytics: true }));
      localStorage.setItem("unrelated-device-preference", "kept");
    },
    [DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY],
  );

  await page.locator('[aria-label="Account"] button').click();
  await page.getByRole("button", { name: "Logout" }).click();

  // The logout leaves through the identity provider and returns to public Home, so the assertions
  // below are made on the application's own origin rather than the provider's.
  await expect(page).toHaveURL(acceptanceUrls.app.replace(/\/$/u, ""));
  await expect(page.getByRole("navigation", { name: "Main" })).toContainText("Documentation");

  await expect
    .poll(async () => Object.keys((await storedValues(page)).local).toSorted())
    .toEqual(expect.not.arrayContaining([RECENT_PROJECTS_STORAGE_KEY]));
  const { local } = await storedValues(page);
  expect(local[DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY]).toBeUndefined();
  // The organisation this account was working as goes with it, so the next caller on this browser
  // does not inherit an identity that was never theirs.
  expect(local[APPLICATION_ORGANISATION_STORAGE_KEY]).toBeUndefined();
  // A logout is not a factory reset: what the browser remembers about itself is untouched.
  expect(local["data-manager-ui-cookie-consent"]).toBe('{"analytics":true}');
  expect(local["unrelated-device-preference"]).toBe("kept");
});
