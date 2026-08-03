import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { APPLICATION_ORGANISATION_STORAGE_KEY } from "../../src/application/applicationIdentity";
import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

const homeUrl = acceptanceUrls.app.replace(/\/$/u, "");

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

test.beforeEach(async ({ request }, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.put(`${acceptanceUrls.control}/scenario/${subject}`);
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.0.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
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
  const canonical = `projects/${fixtureIds.project}/results?search=kinase&type=task&type=instance`;

  await login(page, `${canonical}&unknown=discarded`, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${canonical}`);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  await page.goto(`${acceptanceUrls.app}docs/concepts`);
  await expect(page.getByRole("navigation", { name: "Main" })).toContainText("Documentation");
  await expect(page.getByRole("navigation", { name: "Main" })).not.toContainText("Administration");
});

test("Home exits project scope and browser history restores the canonical project", async ({
  page,
}, testInfo) => {
  const projectPath = `projects/${fixtureIds.project}/files?path=%2Finputs`;
  await login(page, projectPath, testInfo);

  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await page.getByRole("link", { name: "Squonk Home" }).click();
  await expect(page).toHaveURL(homeUrl);
  await expect(page.getByRole("heading", { name: "Files" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent projects" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).not.toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${projectPath}`);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(homeUrl);
});

test("internal configuration remains undiscoverable for authenticated users", async ({
  page,
}, testInfo) => {
  await login(page, "projects", testInfo);
  await page.goto(`${acceptanceUrls.app}configuration`);

  await expect(page.getByRole("heading", { name: "Configuration" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Squonk Home" })).not.toBeVisible();
});

test("organisation change reaches Home before persisting the new identity", async ({
  page,
}, testInfo) => {
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);
  await expect(page.getByText("Acceptance Organisation", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Change organisation" }).click();
  await page.evaluate(() => {
    sessionStorage.removeItem("organisation-project-mismatch");
    const observer = new MutationObserver(() => {
      const filesHeading = [...document.querySelectorAll("h1, h2")].some(
        (heading) => heading.textContent === "Files",
      );
      const partnerIdentity = [...document.querySelectorAll("button")].some((button) =>
        button.textContent.includes("Partner Organisation"),
      );
      if (filesHeading && partnerIdentity) {
        sessionStorage.setItem("organisation-project-mismatch", "true");
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
  await page.getByRole("menuitem", { name: /Partner Organisation/u }).click();

  await expect(page).toHaveURL(homeUrl);
  await expect(page.getByText("Partner Organisation", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Files" })).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("organisation-project-mismatch")))
    .toBeNull();
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
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);

  await expect(page.getByRole("button", { name: "Change organisation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toContainText("Administration");
  await expect(page.getByRole("navigation", { name: "Project" })).toContainText("Manage");
});
