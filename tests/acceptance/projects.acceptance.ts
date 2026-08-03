import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { RECENT_PROJECTS_STORAGE_KEY } from "../../src/projects/recentProjects";
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
        "x-forwarded-for": `10.1.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

test("Project index searches the current organisation and explicitly enters Files", async ({
  page,
  request,
}, testInfo) => {
  await login(page, "projects", testInfo);

  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByText("Partner Project", { exact: true })).not.toBeVisible();
  await page.getByLabel("Search projects").fill("Shared");
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects?search=Shared`);
  await expect(page.getByText("Shared Project", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Acceptance Unit", { exact: false })).toBeVisible();
  await expect(page.getByText("Screening Unit", { exact: false })).toBeVisible();

  await page.getByLabel("Search projects").fill("");
  await page.getByRole("link", { name: /Acceptance Project/u }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/files`);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}`)
    .then((response) => response.json() as Promise<{ requests: { path: string }[] }>);
  expect(diagnostics.requests.map(({ path }) => path)).toEqual(
    expect.arrayContaining([`/project/${fixtureIds.project}`, `/product/${fixtureIds.product}`]),
  );
});

test("Project 403 and 404 share a non-disclosing result and clear recent content", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const projectPath = `projects/${fixtureIds.project}/files`;
  await login(page, projectPath, testInfo);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .toContain(fixtureIds.project);

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/project-failure?status=403`);
  await page.reload();
  await expect(
    page.getByText("This project is unavailable or you no longer have access."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Files" })).not.toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .not.toContain(fixtureIds.project);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-failure`);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .toContain(fixtureIds.project);

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/project-failure?status=404`);
  await page.reload();
  await expect(
    page.getByText("This project is unavailable or you no longer have access."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Files" })).not.toBeVisible();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), RECENT_PROJECTS_STORAGE_KEY))
    .not.toContain(fixtureIds.project);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${projectPath}`);
});

test("transient Project failure retains chrome and retries without changing scope", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const projectPath = `projects/${fixtureIds.project}/files`;
  await login(page, projectPath, testInfo);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await page.getByRole("link", { name: "Squonk Home" }).click();
  await expect(page).toHaveURL(acceptanceUrls.app.slice(0, -1));
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/project-failure?status=503`);
  await page.goBack();

  await expect(
    page.getByText("Project data could not be loaded. Retry this project."),
  ).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${projectPath}`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${projectPath}`);
});
