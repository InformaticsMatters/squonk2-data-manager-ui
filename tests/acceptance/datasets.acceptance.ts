import { expect, type Page, test, type TestInfo } from "@playwright/test";

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
        "x-forwarded-for": `10.4.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

test("Datasets keeps global list state and exact version identity in browser history", async ({
  page,
}, testInfo) => {
  await login(page, "datasets?unowned=ignored", testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets`);
  await expect(page.getByText("globally-shared.csv", { exact: true })).toBeVisible();
  await expect(page.getByText("No available versions", { exact: true })).toBeVisible();
  await page.getByLabel("Search datasets").fill("acceptance");
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets?search=acceptance`);
  await expect(page.getByText("globally-shared.csv", { exact: true })).not.toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets?search=acceptance`);
  await expect(page.getByLabel("Search datasets")).toHaveValue("acceptance");
  await expect(page.getByText("globally-shared.csv", { exact: true })).not.toBeVisible();

  await page.getByRole("link", { name: "acceptance-dataset-v2.sdf" }).click();
  const versionTwo = `datasets/${fixtureIds.dataset}/versions/2?search=acceptance`;
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionTwo}`);
  await expect(
    page.getByRole("dialog", { name: "Dataset acceptance-dataset-v2.sdf" }),
  ).toBeVisible();

  await page.getByLabel("Select a version").click();
  await page.getByRole("option", { name: "v1" }).click();
  const versionOne = `datasets/${fixtureIds.dataset}/versions/1?search=acceptance`;
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionOne}`);
  await expect(
    page.getByRole("dialog", { name: "Dataset acceptance-dataset-v1.sdf" }),
  ).toBeVisible();
  await expect(page.getByText("02/01/26 03:04:05", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Plaintext Viewer" })).toHaveAttribute(
    "href",
    `/data-manager-ui/datasets/${fixtureIds.dataset}/versions/1/view?search=acceptance`,
  );
  await expect(
    page.getByRole("link", { name: "Download this version of the dataset" }),
  ).toHaveAttribute("href", `/api/dm-api/dataset/${fixtureIds.dataset}/1`);
  await page.getByText("View and Edit the Dataset Schema", { exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Edit Schema" })).toBeVisible();
  await expect(page.getByLabel("Schema description")).toHaveValue("Version one schema");
  await expect(page.getByText("version_one_field", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).last().click();

  await page.getByRole("button", { name: "Close" }).last().click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets?search=acceptance`);
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionTwo}`);
  await expect(
    page.getByRole("dialog", { name: "Dataset acceptance-dataset-v2.sdf" }),
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets?search=acceptance`);
});

test("dataset convenience and direct routes resolve without guessing missing identity", async ({
  page,
  request,
}, testInfo) => {
  await login(page, `datasets/${fixtureIds.dataset}`, testInfo);

  const canonical = `${acceptanceUrls.app}datasets/${fixtureIds.dataset}/versions/2`;
  await expect(page).toHaveURL(canonical);
  await expect(
    page.getByRole("dialog", { name: "Dataset acceptance-dataset-v2.sdf" }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(canonical);
  await expect(page.getByLabel("Select a version")).toHaveText("v2");

  await page.getByRole("link", { name: "Plaintext Viewer" }).click();
  await expect(page).toHaveURL(`${canonical}/view`);
  await expect(page.getByRole("heading", { name: "acceptance-dataset-v2.sdf" })).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("dialog", { name: "Dataset acceptance-dataset-v2.sdf" }),
  ).toBeVisible();

  await page.goto(`datasets/${fixtureIds.dataset}/versions/99`);
  await expect(page.getByText("Dataset version not found")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets/${fixtureIds.dataset}/versions/99`);

  await page.goto(`datasets/${fixtureIds.missingDataset}`);
  await expect(page.getByText("Dataset not found")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets/${fixtureIds.missingDataset}`);

  await page.goto(`datasets/${fixtureIds.dataset}/versions/01`);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets/${fixtureIds.dataset}/versions/01`);

  await page.goto(`datasets/${fixtureIds.dataset}/versions/01/view`);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}`)
    .then((response) => response.json() as Promise<{ requests: { path: string }[] }>);
  expect(diagnostics.requests.map(({ path }) => path)).not.toContain(
    `/dataset/${fixtureIds.dataset}/1`,
  );
});

test("recoverable dataset failure retries the same exact version", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/dataset-failure?status=503`);
  const path = `datasets/${fixtureIds.dataset}/versions/1`;
  await login(page, "datasets?search=acceptance", testInfo);

  await expect(
    page.getByText(
      "Dataset list could not be loaded. Retry without changing the current Datasets view.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets?search=acceptance`);
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/dataset-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("link", { name: "acceptance-dataset-v2.sdf" })).toBeVisible();

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/dataset-failure?status=503`);
  await page.goto(path);

  await expect(
    page.getByText(
      "Dataset data could not be loaded. Retry this dataset without changing the requested version.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/dataset-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(
    page.getByRole("dialog", { name: "Dataset acceptance-dataset-v1.sdf" }),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);

  const viewerPath = `${path}/view`;
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/dataset-content-failure?status=503`,
  );
  await page.goto(viewerPath);
  await expect(
    page.getByText("Dataset content could not be loaded. Retry this exact version."),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${viewerPath}`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/dataset-content-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: "acceptance-dataset-v1.sdf" })).toBeVisible();
  await expect(page.getByText("acceptance dataset version 1", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${viewerPath}`);
  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json() as Promise<{ requests: { path: string }[] }>);
  expect(diagnostics.requests.map(({ path }) => path)).toContain(
    `/dataset/${fixtureIds.dataset}/1`,
  );
});
