import { expect, type Page, test } from "@playwright/test";

import { APPLICATION_ORGANISATION_STORAGE_KEY } from "../../src/application/applicationIdentity";
import { fixtureIds } from "./services/fixtures";

const homeUrl = acceptanceUrls.app.replace(/\/$/u, "");

test.describe.configure({ mode: "serial" });
import { acceptanceUrls } from "./environment";

const login = async (page: Page, subject: string, path: string) => {
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subject);
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

test("public Home and Documentation retain public navigation", async ({ page }) => {
  await page.goto(".");
  await expect(page.getByRole("navigation", { name: "Main" })).toContainText("Documentation");
  await expect(page.getByRole("link", { name: "Squonk Home" })).toHaveAttribute(
    "href",
    "/data-manager-ui",
  );
  await page.getByRole("link", { name: "Documentation" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}docs/concepts`);
  await expect(page.getByRole("navigation", { name: "Main" })).not.toContainText("Configuration");
});

test("protected login returns to the exact canonical route and allowed query", async ({
  page,
}, testInfo) => {
  const subject = `acceptance-worker-${testInfo.parallelIndex}`;
  const canonical = `projects/${fixtureIds.project}/results?search=kinase&type=task&type=instance`;

  await login(page, subject, `${canonical}&unknown=discarded`);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${canonical}`);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  await page.goto(`${acceptanceUrls.app}docs/concepts`);
  await expect(page.getByRole("navigation", { name: "Main" })).toContainText("Documentation");
  await expect(page.getByRole("navigation", { name: "Main" })).not.toContainText("Administration");
});

test("Home exits project scope and browser history restores the canonical project", async ({
  page,
}, testInfo) => {
  const subject = `acceptance-worker-${testInfo.parallelIndex}`;
  const projectPath = `projects/${fixtureIds.project}/files?path=%2Finputs`;
  await login(page, subject, projectPath);

  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await page.getByRole("link", { name: "Squonk Home" }).click();
  await expect(page).toHaveURL(homeUrl);
  await expect(page.getByRole("heading", { name: "Files" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent projects" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${projectPath}`);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(homeUrl);
});

test("organisation change reaches Home before persisting the new identity", async ({
  page,
}, testInfo) => {
  const subject = `acceptance-worker-${testInfo.parallelIndex}`;
  await login(page, subject, `projects/${fixtureIds.project}/files`);
  await expect(page.getByText("Acceptance Organisation", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Change organisation" }).click();
  await page.getByRole("menuitem", { name: /Partner Organisation/u }).click();

  await expect(page).toHaveURL(homeUrl);
  await expect(page.getByText("Partner Organisation", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Files" })).not.toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), APPLICATION_ORGANISATION_STORAGE_KEY),
    )
    .toContain(fixtureIds.otherOrganisation);

  await page.reload();
  await expect(page.getByText("Partner Organisation", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Open files" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/files`);
  await expect(page.getByText("Acceptance Organisation", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
});

test("narrow project layout retains organisation and project navigation cues", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ height: 800, width: 390 });
  const subject = `acceptance-worker-${testInfo.parallelIndex}`;
  await login(page, subject, `projects/${fixtureIds.project}/files`);

  await expect(page.getByRole("button", { name: "Change organisation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toContainText("Administration");
  await expect(page.getByRole("navigation", { name: "Project" })).toContainText("Manage");
});
