import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const resetScenario = async (
  request: { put: (url: string) => Promise<unknown> },
  testInfo: TestInfo,
  profile?: string,
) => {
  const query = profile ? `?profile=${profile}` : "";
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}${query}`);
};

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

/** Drops a file into the batch without depending on a native file chooser. */
const dropFile = async (page: Page, name: string) => {
  await page
    .getByRole("dialog", { name: "Upload New Datasets" })
    .locator("input[type=file]")
    .setInputFiles({
      buffer: Buffer.from(`acceptance ${name}\n`),
      mimeType: "chemical/x-mdl-sdfile",
      name,
    });
};

const openUpload = async (page: Page) => {
  await page.getByRole("button", { name: "Upload dataset" }).click();
  await expect(page.getByRole("dialog", { name: "Upload New Datasets" })).toBeVisible();
};

const billingUnit = (page: Page) => page.getByRole("combobox", { name: "Billing unit" });

const chooseBillingUnit = async (page: Page, name: string) => {
  await billingUnit(page).click();
  await page.getByRole("option", { name: new RegExp(`^${name}`, "u") }).click();
};

const rememberedUnitId = (page: Page) =>
  page.evaluate(() => localStorage.getItem("data-manager-ui-dataset-upload-unit"));

test("an upload requires an explicit billing unit and only then invalidates the list", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await resetScenario(request, testInfo);
  await login(page, "datasets", testInfo);

  await openUpload(page);
  await expect(billingUnit(page)).toHaveText("");
  await dropFile(page, "explicit.sdf");
  await expect(page.getByRole("button", { name: "Upload", exact: true })).toBeDisabled();

  await chooseBillingUnit(page, "Acceptance Unit");
  await expect(page.getByRole("button", { name: "Upload", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Upload", exact: true }).click();

  await expect(page.getByText("explicit.sdf uploaded and processed.")).toBeVisible({
    timeout: 20_000,
  });
  // The billing unit is locked for the rest of the batch and remembered for the next one.
  await expect(billingUnit(page)).toBeDisabled();
  expect(await rememberedUnitId(page)).toContain(fixtureIds.unit);

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) =>
        response.json() as Promise<{
          requests: { method: string; path: string }[];
          upload?: object;
        }>,
    );
  expect(diagnostics.upload).toBeDefined();
  expect(diagnostics.requests).toContainEqual(
    expect.objectContaining({ method: "POST", path: "/dataset" }),
  );
  expect(diagnostics.requests).toContainEqual(
    expect.objectContaining({ method: "GET", path: `/task/${fixtureIds.task}` }),
  );
});

test("a remembered billing unit is reused only while it is still eligible", async ({
  page,
  request,
}, testInfo) => {
  await resetScenario(request, testInfo);
  await login(page, "datasets", testInfo);
  await page.evaluate(
    ([unitId]) =>
      localStorage.setItem(
        "data-manager-ui-dataset-upload-unit",
        JSON.stringify({ unitId, version: 1 }),
      ),
    [fixtureIds.unit],
  );
  await page.reload();

  await openUpload(page);
  await expect(billingUnit(page)).toHaveText(/Acceptance Unit/u);
  await expect(
    page.getByText("Using the billing unit of your last successful upload.", { exact: false }),
  ).toBeVisible();

  // A remembered unit the caller is no longer a member of selects nothing at all.
  await page.evaluate(
    ([unitId]) =>
      localStorage.setItem(
        "data-manager-ui-dataset-upload-unit",
        JSON.stringify({ unitId, version: 1 }),
      ),
    [fixtureIds.unlistedUnit],
  );
  await page.reload();
  await openUpload(page);
  await expect(billingUnit(page)).toHaveText("");
  await dropFile(page, "unremembered.sdf");
  await expect(page.getByRole("button", { name: "Upload", exact: true })).toBeDisabled();
});

test("a caller with no member unit keeps a disabled Upload that explains itself", async ({
  page,
  request,
}, testInfo) => {
  await resetScenario(request, testInfo, "no-access");
  await login(page, "datasets", testInfo);

  const upload = page.getByRole("button", { name: "Upload dataset" });
  await expect(upload).toBeVisible();
  await expect(upload).toBeDisabled();
  await upload.hover({ force: true });
  await expect(page.getByText("You must be a member of a unit to upload a dataset.")).toBeVisible();
});

test("a unit without a dataset subscription keeps the batch and offers Administration", async ({
  page,
  request,
}, testInfo) => {
  await resetScenario(request, testInfo);
  await login(page, "datasets", testInfo);

  await openUpload(page);
  await dropFile(page, "unsubscribed.sdf");
  await page.getByLabel("File name").fill("renamed-batch");
  await chooseBillingUnit(page, "Screening Unit");

  await expect(page.getByText("Screening Unit has no dataset subscription")).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload", exact: true })).toBeDisabled();
  // Nothing entered is lost by the refusal.
  await expect(page.getByLabel("File name")).toHaveValue("renamed-batch");
  await expect(page.getByRole("link", { name: "Go to Subscriptions" })).toHaveAttribute(
    "href",
    "/data-manager-ui/administration/subscriptions",
  );

  await chooseBillingUnit(page, "Acceptance Unit");
  await expect(page.getByText("has no dataset subscription")).not.toBeVisible();
  await expect(page.getByLabel("File name")).toHaveValue("renamed-batch");
  await expect(page.getByRole("button", { name: "Upload", exact: true })).toBeEnabled();
});

test("an evaluation account is told who can subscribe a unit it cannot", async ({
  page,
  request,
}, testInfo) => {
  await resetScenario(request, testInfo, "evaluator");
  await login(page, "datasets", testInfo);

  await openUpload(page);
  await dropFile(page, "evaluated.sdf");
  await chooseBillingUnit(page, "Screening Unit");

  await expect(page.getByText("Screening Unit has no dataset subscription")).toBeVisible();
  await expect(
    page.getByText("Evaluation accounts can only subscribe their own personal unit.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to Subscriptions" })).toHaveCount(0);
});

test("a refused request keeps its own file retryable without re-entering the batch", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await resetScenario(request, testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/upload-failure?status=403`);
  await login(page, "datasets", testInfo);

  await openUpload(page);
  await dropFile(page, "refused.sdf");
  await chooseBillingUnit(page, "Acceptance Unit");
  await page.getByRole("button", { name: "Upload", exact: true }).click();

  // The file keeps the refusal's own reason next to it, not only in a notification.
  await expect(
    page.getByRole("dialog", { name: "Upload New Datasets" }).getByText("fixture-forbidden"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry refused.sdf" })).toBeVisible();
  // Nothing reached the Data Manager, so the batch is not yet bound to the unit that refused it.
  await expect(billingUnit(page)).toBeEnabled();

  // A transport failure carries no words of its own, so the file says what it can be told.
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/upload-failure?status=503`);
  await page.getByRole("button", { name: "Retry refused.sdf" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Upload New Datasets" })
      .getByText("This upload could not be sent. Retry this file."),
  ).toBeVisible();
  await expect(billingUnit(page)).toBeEnabled();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/upload-failure`);
  await page.getByRole("button", { name: "Retry refused.sdf" }).click();
  await expect(page.getByText("refused.sdf uploaded and processed.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("button", { name: "Retry refused.sdf" })).toHaveCount(0);
  await expect(billingUnit(page)).toBeDisabled();
});

test("a nonzero processing task is never presented as a successful upload", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await resetScenario(request, testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/upload-exit-code?value=17`);
  await login(page, "datasets", testInfo);

  await openUpload(page);
  await dropFile(page, "rejected.sdf");
  await chooseBillingUnit(page, "Acceptance Unit");
  await page.getByRole("button", { name: "Upload", exact: true }).click();

  await expect(page.getByText("Dataset processing failed with exit code 17.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("rejected.sdf uploaded and processed.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry rejected.sdf" })).toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/upload-exit-code`);
  await page.getByRole("button", { name: "Retry rejected.sdf" }).click();
  await expect(page.getByText("rejected.sdf uploaded and processed.")).toBeVisible({
    timeout: 20_000,
  });
});

test("a transient status failure keeps a file processing rather than failing it", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await resetScenario(request, testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await login(page, "datasets", testInfo);

  await openUpload(page);
  await dropFile(page, "unreadable.sdf");
  await chooseBillingUnit(page, "Acceptance Unit");
  await page.getByRole("button", { name: "Upload", exact: true }).click();

  await expect(
    page.getByText("Upload progress could not be read. This file is still being processed."),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Retry unreadable.sdf" })).toHaveCount(0);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await expect(page.getByText("unreadable.sdf uploaded and processed.")).toBeVisible({
    timeout: 30_000,
  });
});
