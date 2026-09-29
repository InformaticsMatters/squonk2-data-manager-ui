import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const versionTwo = `datasets/${fixtureIds.dataset}/versions/2`;

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}`);
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.13.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

const versionDialog = (page: Page) =>
  page.getByRole("dialog", { name: "Upload a New Version to acceptance-dataset-v2.sdf" });

const openVersionUpload = async (page: Page) => {
  await page.getByText("Create a New Version of this Dataset", { exact: true }).click();
  await expect(versionDialog(page)).toBeVisible();
};

/** Drops the successor file into the form without depending on a native file chooser. */
const dropFile = async (page: Page, name: string) => {
  await versionDialog(page)
    .locator("input[type=file]")
    .setInputFiles({
      buffer: Buffer.from(`acceptance ${name}\n`),
      mimeType: "chemical/x-mdl-sdfile",
      name,
    });
};

const upload = (page: Page) => versionDialog(page).getByRole("button", { name: "Upload" });

type Diagnostics = {
  requests: { method: string; path: string }[];
  upload?: { fields: Record<string, string> };
};

const readDiagnostics = (
  request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> },
  subject: string,
) =>
  request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json() as Promise<Diagnostics>);

test("a new version inherits the dataset's own billing unit whatever the shell was last showing", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  // Entering a project of the Screening Unit leaves that unit as the shell's selected identity, so
  // a version billed from selected state rather than from the dataset would bill the wrong unit.
  await login(page, `projects/${fixtureIds.screeningProject}/files`, testInfo);
  await expect(page.getByText("Screening Unit · Acceptance Organisation")).toBeVisible();

  await page.goto(`${acceptanceUrls.app}${versionTwo}`);
  await expect(
    page.getByRole("dialog", { name: "Dataset acceptance-dataset-v2.sdf" }),
  ).toBeVisible();
  await openVersionUpload(page);

  // The unit is the dataset's own, shown and not chosen.
  const billingUnit = versionDialog(page).getByLabel("Billing unit");
  await expect(billingUnit).toHaveValue("Acceptance Unit — Acceptance Organisation");
  await expect(billingUnit).toBeDisabled();

  await dropFile(page, "successor.sdf");
  await upload(page).click();
  // Closing the form does not abandon work the Data Manager is still doing: the task is watched
  // by the action itself, so it settles whether or not the dialog is on screen.
  await page.getByRole("button", { name: "Close" }).last().click();
  await expect(versionDialog(page)).toHaveCount(0);

  // The retained filename and type are the latest version's, and the unit is the dataset's.
  const { upload: sent } = await readDiagnostics(request, subject);
  expect(sent?.fields).toEqual(
    expect.objectContaining({
      as_filename: "acceptance-dataset-v2.sdf",
      dataset_id: fixtureIds.dataset,
      dataset_type: "chemical/x-mdl-sdfile",
      unit_id: fixtureIds.unit,
    }),
  );

  // The collection is only re-read once a task actually finished, so a dataset list request made
  // after the task settled is what proves the invalidation happened, and happened for that reason.
  await expect
    .poll(
      async () => {
        const { requests } = await readDiagnostics(request, subject);
        const settled = requests.findLastIndex(
          ({ method, path }) => method === "GET" && path.startsWith("/task/"),
        );
        return requests.findIndex(
          ({ method, path }, index) => index > settled && method === "GET" && path === "/dataset",
        );
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(-1);

  // Reopening shows the outcome the closed form still collected, and the route never moved.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionTwo}`);
  await openVersionUpload(page);
  await expect(page.getByText("successor.sdf uploaded and processed.")).toBeVisible();

  // A version the Data Manager finished with leaves the form, so the next one starts clean.
  await page.getByRole("button", { name: "Close" }).last().click();
  await openVersionUpload(page);
  await expect(versionDialog(page).getByText("successor.sdf")).toHaveCount(0);
  await expect(upload(page)).toBeDisabled();
  await page.getByRole("button", { name: "Close" }).last().click();

  await page.getByLabel("Select a version").click();
  await expect(page.getByRole("option", { name: "v3" })).toBeVisible();
  await page.getByRole("option", { name: "v2" }).click();

  // The dataset's own route now canonicalises to the version the Data Manager actually made.
  await page.goto(`${acceptanceUrls.app}datasets/${fixtureIds.dataset}`);
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets/${fixtureIds.dataset}/versions/3`);
});

test("a billing unit that cannot be established disables the upload with its own reason", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  // The generated inventory is the only resource that says which unit holds a dataset, so a read
  // it refuses is exactly the state in which no billing ancestry can be established.
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/inventory-failure?status=403`);
  await login(page, versionTwo, testInfo);

  // The action stays discoverable and states what is missing rather than disappearing.
  const action = page.getByText("Create a New Version of this Dataset", { exact: true });
  await expect(action).toBeVisible();
  await expect(
    page.getByText("This dataset's billing unit could not be read", { exact: false }),
  ).toBeVisible();

  // The action is refused rather than merely explained: forcing the click opens nothing.
  await action.click({ force: true });
  await expect(versionDialog(page)).toHaveCount(0);
  // Nothing is sent, because nothing could be billed.
  const { requests } = await readDiagnostics(request, subject);
  expect(requests).not.toContainEqual(
    expect.objectContaining({ method: "POST", path: "/dataset" }),
  );
});

test("a refused version request keeps its own reason and stays retryable in place", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/upload-failure?status=403`);
  await login(page, versionTwo, testInfo);
  await openVersionUpload(page);
  await dropFile(page, "refused-version.sdf");
  await upload(page).click();

  await expect(versionDialog(page).getByText("fixture-forbidden")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry refused-version.sdf" })).toBeVisible();

  // A transport that failed on the way carries no words of its own.
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/upload-failure?status=503`);
  await page.getByRole("button", { name: "Retry refused-version.sdf" }).click();
  await expect(
    versionDialog(page).getByText("This upload could not be sent. Retry this file."),
  ).toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/upload-failure`);
  await page.getByRole("button", { name: "Retry refused-version.sdf" }).click();
  await expect(page.getByText("refused-version.sdf uploaded and processed.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("button", { name: "Retry refused-version.sdf" })).toHaveCount(0);
});

test("a nonzero version task is never presented as a successful version", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/upload-exit-code?value=17`);
  await login(page, versionTwo, testInfo);
  await openVersionUpload(page);
  await dropFile(page, "rejected-version.sdf");
  await upload(page).click();

  await expect(page.getByText("Dataset processing failed with exit code 17.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("rejected-version.sdf uploaded and processed.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry rejected-version.sdf" })).toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/upload-exit-code`);
  await page.getByRole("button", { name: "Retry rejected-version.sdf" }).click();
  await expect(page.getByText("rejected-version.sdf uploaded and processed.")).toBeVisible({
    timeout: 20_000,
  });
});

test("a transient status failure keeps a version processing rather than failing it", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await login(page, versionTwo, testInfo);
  await openVersionUpload(page);
  await dropFile(page, "unreadable-version.sdf");
  await upload(page).click();

  await expect(
    page.getByText("Upload progress could not be read. This file is still being processed."),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Retry unreadable-version.sdf" })).toHaveCount(0);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await expect(page.getByText("unreadable-version.sdf uploaded and processed.")).toBeVisible({
    timeout: 30_000,
  });
});
