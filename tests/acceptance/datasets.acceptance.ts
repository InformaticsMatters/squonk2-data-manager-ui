import { expect, type Page, test, type TestInfo } from "@playwright/test";
import { gunzipSync } from "node:zlib";

import { fixtureIds } from "./services/fixtures";
import { type AttachmentRecord } from "./services/state";
import { acceptanceUrls } from "./environment";
import { linkColour } from "./theme";

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
  ).toHaveAttribute("href", `/data-manager-ui/api/dm-api/dataset/${fixtureIds.dataset}/1`);
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

test("dataset version viewers keep canonical identity across every transport", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const versionOne = `datasets/${fixtureIds.dataset}/versions/1`;
  const viewerPath = `${versionOne}/view?search=acceptance`;
  await login(page, `${versionOne}/view?unowned=ignored&search=acceptance`, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${viewerPath}`);
  await expect(page.getByRole("heading", { name: "acceptance-dataset-v1.sdf" })).toBeVisible();
  await expect(page.getByText("acceptance dataset version 1", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${viewerPath}`);
  await expect(page.getByRole("heading", { name: "acceptance-dataset-v1.sdf" })).toBeVisible();
  await expect(page.getByText("acceptance dataset version 1", { exact: true })).toBeVisible();

  const downloadHref = `/data-manager-ui/api/dm-api/dataset/${fixtureIds.dataset}/1`;
  const browserViewHref = `/data-manager-ui/api/viewer-proxy/dataset/${fixtureIds.dataset}/1`;
  const transportUrl = (href: string) => new URL(href, acceptanceUrls.app).toString();
  const download = await page.request.get(transportUrl(downloadHref));
  expect(download.status()).toBe(200);
  expect(gunzipSync(await download.body()).toString()).toBe("acceptance dataset version 1\n");

  const browserView = await page.request.get(transportUrl(browserViewHref));
  expect(browserView.status()).toBe(200);
  expect(browserView.headers()["content-disposition"]).toBe("inline");
  expect(gunzipSync(await browserView.body()).toString()).toBe("acceptance dataset version 1\n");

  await page.getByRole("link", { name: "Back to dataset version" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionOne}?search=acceptance`);
  const datasetDialog = page.getByRole("dialog", { name: "Dataset acceptance-dataset-v1.sdf" });
  await expect(datasetDialog).toBeVisible();
  await expect(page.getByRole("link", { name: "Browser Viewer" })).toHaveAttribute(
    "href",
    browserViewHref,
  );
  await expect(
    page.getByRole("link", { name: "Download this version of the dataset" }),
  ).toHaveAttribute("href", downloadHref);

  await page.getByRole("link", { name: "Plaintext Viewer" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${viewerPath}`);
  await expect(page.getByText("acceptance dataset version 1", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionOne}?search=acceptance`);
  await expect(datasetDialog).toBeVisible();

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
    );
  expect(diagnostics.requests).toContainEqual(
    expect.objectContaining({ method: "GET", path: `/dataset/${fixtureIds.dataset}/1` }),
  );
  expect(diagnostics.requests).not.toContainEqual(
    expect.objectContaining({ method: "GET", path: `/dataset/${fixtureIds.dataset}/2` }),
  );
});

test("viewer absence, denial, and the removed legacy route never adopt another version", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const versionOne = `datasets/${fixtureIds.dataset}/versions/1`;
  await login(page, `${versionOne}/view`, testInfo);
  await expect(page.getByText("acceptance dataset version 1", { exact: true })).toBeVisible();

  const missing = await page.goto(`datasets/${fixtureIds.dataset}/versions/99/view`);
  expect(missing?.status()).toBe(404);
  await expect(page.getByText("Dataset version not found")).toBeVisible();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}datasets/${fixtureIds.dataset}/versions/99/view`,
  );

  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/dataset-content-failure?status=403`,
  );
  const denied = await page.goto(`${versionOne}/view`);
  expect(denied?.status()).toBe(missing?.status());
  await expect(page.getByText("Dataset version not found")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionOne}/view`);
  await expect(page.getByText("acceptance dataset version 1", { exact: true })).not.toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/dataset-content-failure`);
  await page.reload();
  await expect(page.getByText("acceptance dataset version 1", { exact: true })).toBeVisible();

  await page.goto(`dataset/${fixtureIds.dataset}/1`);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json() as Promise<{ requests: { path: string }[] }>);
  expect(diagnostics.requests.map(({ path }) => path)).not.toContain(
    `/dataset/${fixtureIds.dataset}/2`,
  );
});

test("dataset mutations retain version scope and recover from authoritative rejection", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const path = `datasets/${fixtureIds.dataset}/versions/1`;
  await login(page, path, testInfo);
  const datasetDialog = page.getByRole("dialog", { name: "Dataset acceptance-dataset-v1.sdf" });
  await expect(page.getByLabel("Select a version")).toHaveText("v1");

  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/dataset-mutation-failure?status=403`,
  );
  await page.getByRole("button", { name: "Add a new label" }).click();
  await page.getByLabel("Name").fill("assay");
  await page.getByLabel("Value").fill("validated");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(
    page.getByText(
      `You no longer have permission to change labels for dataset ${fixtureIds.dataset} version 1. The displayed dataset version has not changed.`,
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  await expect(page.getByLabel("Name")).toHaveValue("assay");
  await expect(page.getByLabel("Value")).toHaveValue("validated");

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/dataset-mutation-failure`);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(datasetDialog.getByText("assay=validated", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Select a version")).toHaveText("v1");
  await datasetDialog.getByLabel("Remove assay=validated").click();
  await expect(datasetDialog.getByText("assay=validated", { exact: true })).not.toBeVisible();

  const colleague = `${subject}-observer`;
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/dataset-mutation-failure?status=403`,
  );
  await page.getByLabel("Editors").fill(colleague);
  await page.getByRole("option", { name: colleague }).click();
  await expect(
    page.getByText(
      `You no longer have permission to manage editors for dataset ${fixtureIds.dataset} version 1. The displayed dataset version has not changed.`,
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Editors")).toHaveValue(colleague);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/dataset-mutation-failure`);
  await page.getByLabel("Editors").click();
  await page.getByRole("option", { name: colleague }).click();
  await expect(page.getByText(`User ${colleague} added successfully`)).toBeVisible();
  await expect(page.getByLabel("Select a version")).toHaveText("v1");
  await page.getByLabel(`Remove ${colleague}`).click();
  await expect(page.getByText(`User ${colleague} removed successfully`)).toBeVisible();

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/concurrent-dataset-version`);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await page.getByText("Delete this Version of the Dataset", { exact: true }).click();
  const deleteVersionOneDialog = page.getByRole("dialog", { name: "Delete v1" });
  await deleteVersionOneDialog.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByText(
      `Could not delete dataset ${fixtureIds.dataset} version 1. The displayed dataset version has not changed; retry is available.`,
    ),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  await expect(deleteVersionOneDialog).toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await deleteVersionOneDialog.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets/${fixtureIds.dataset}/versions/3`);
  await expect(page.getByLabel("Select a version")).toHaveText("v3");
  await expect(page.getByText("Dataset version deleted", { exact: true })).toBeVisible();

  await page.getByText("Delete this Version of the Dataset", { exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete v3" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets/${fixtureIds.dataset}/versions/2`);
  await expect(page.getByLabel("Select a version")).toHaveText("v2");

  await page.getByText("Delete this Version of the Dataset", { exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete v2" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets`);
  await expect(page.getByRole("dialog")).not.toBeVisible();

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
    );
  expect(diagnostics.requests.map(({ method, path }) => ({ method, path }))).toEqual(
    expect.arrayContaining([
      { method: "POST", path: `/dataset/${fixtureIds.dataset}/meta/1` },
      { method: "PUT", path: `/dataset/${fixtureIds.dataset}/editor/${colleague}` },
      { method: "DELETE", path: `/dataset/${fixtureIds.dataset}/editor/${colleague}` },
      { method: "DELETE", path: `/dataset/${fixtureIds.dataset}/1` },
      { method: "DELETE", path: `/dataset/${fixtureIds.dataset}/3` },
      { method: "DELETE", path: `/dataset/${fixtureIds.dataset}/2` },
    ]),
  );
  expect(
    diagnostics.requests.filter(
      ({ method, path }) => method === "DELETE" && path === `/dataset/${fixtureIds.dataset}/1`,
    ),
  ).toHaveLength(1);
});

test("bulk deletion retains mixed permissions and retries accepted work", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/undeletable-dataset-version`);
  await login(page, "datasets", testInfo);

  const ownedDatasetRow = page
    .getByRole("row")
    .filter({ has: page.getByRole("link", { name: "acceptance-dataset-v2.sdf" }) });
  const sharedDatasetRow = page.getByRole("row").filter({ hasText: "globally-shared.csv" });
  await ownedDatasetRow.getByRole("checkbox").check();
  await sharedDatasetRow.getByRole("checkbox").check();
  await expect(page.getByText("Selected: 3")).toBeVisible();

  await page.getByRole("button", { name: "Delete selected datasets" }).click();
  const confirmation = page.getByRole("dialog", { name: "Delete selected" });
  await expect(confirmation.getByText("globally-shared.csv", { exact: false })).toBeVisible();

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await confirmation.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("2 dataset(s) could not be deleted")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Selected: 3")).toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await page.getByRole("button", { name: "Delete selected datasets" }).click();
  await page
    .getByRole("dialog", { name: "Delete selected" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByText("Datasets deleted successfully")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("globally-shared.csv", { exact: true })).toBeVisible();
  await expect(page.getByText("acceptance-dataset-v2.sdf", { exact: true })).not.toBeVisible();

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
    );
  for (const version of [1, 2]) {
    expect(
      diagnostics.requests.filter(
        ({ method, path }) =>
          method === "DELETE" && path === `/dataset/${fixtureIds.dataset}/${version}`,
      ),
    ).toHaveLength(1);
  }
});

type AttachmentDiagnostics = {
  attachments: AttachmentRecord[];
  requests: { method: string; path: string }[];
};

const attachmentDiagnostics = async (
  request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> },
  subject: string,
) =>
  (await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json())) as AttachmentDiagnostics;

const versionOnePath = `datasets/${fixtureIds.dataset}/versions/1`;
const attachDialogName = "Attach acceptance-dataset-v1.sdf v1 to a Project";
const partnerTarget = "Partner Project — Acceptance Unit, Partner Organisation";

test("a dataset version is attached to an explicit editable project in another organisation", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, versionOnePath, testInfo);

  await page.getByText("Attach Dataset to a Project", { exact: true }).click();
  const attachDialog = page.getByRole("dialog", { name: attachDialogName });
  // Nothing is chosen for the caller, whatever project or unit the rest of the session used.
  await expect(attachDialog.getByLabel("Project")).toHaveText("Select a project");

  await attachDialog.getByLabel("Project").click();
  // Duplicate project names are told apart by the unit and organisation that hold them, and a
  // project the caller only observes is not a target at all.
  await expect(
    page.getByRole("option", { name: "Shared Project — Acceptance Unit, Acceptance Organisation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Shared Project — Screening Unit, Acceptance Organisation" }),
  ).toBeVisible();
  await expect(page.getByRole("option", { name: /^Screening Project/u })).toHaveCount(0);
  await page.getByRole("option", { name: partnerTarget }).click();

  await attachDialog.getByLabel("Path").fill("/inputs");
  await attachDialog.getByLabel("Compress").check();
  await attachDialog.getByLabel("Immutable").uncheck();
  await attachDialog.getByRole("button", { name: "Attach" }).click();

  await expect(
    attachDialog.getByText("Attaching to Partner Project", { exact: false }),
  ).toBeVisible();
  await expect(attachDialog.getByText(`Attached to ${partnerTarget}.`)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionOnePath}`);

  // Every option entered reached the Data Manager, against the project that was named.
  const diagnostics = await attachmentDiagnostics(request, subject);
  expect(diagnostics.attachments).toEqual([
    {
      as_type: "chemical/x-mdl-sdfile",
      compress: true,
      dataset_id: fixtureIds.dataset,
      dataset_version: 1,
      immutable: false,
      path: "/inputs",
      project_id: fixtureIds.partnerProject,
    },
  ]);

  // Success refreshed the dataset's own attachment state.
  await expect(
    attachDialog.getByRole("link", { name: "Open Partner Project files" }),
  ).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.partnerProject}/files?path=%2Finputs`,
  );
  await attachDialog.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Currently attached to:", { exact: false })).toContainText(
    "Partner Project",
  );

  // A second attachment starts from no target again rather than from the one just used.
  await page.getByText("Attach Dataset to a Project", { exact: true }).click();
  const reopened = page.getByRole("dialog", { name: attachDialogName });
  await expect(reopened.getByLabel("Project")).toHaveText("Select a project");
  await reopened.getByRole("button", { name: "Close" }).click();

  // Navigation goes to the project that was attached to, whose listing now holds the new file.
  await page.goto(`projects/${fixtureIds.partnerProject}/files?path=%2Finputs`);
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}projects/${fixtureIds.partnerProject}/files?path=%2Finputs`,
  );
  await expect(page.getByText("Partner Project", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "acceptance-dataset-v1.sdf.gz" }),
  ).toBeVisible();
});

test("attachment is offered and disabled when the caller can edit no project", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/no-editable-projects`);
  await login(page, versionOnePath, testInfo);

  const attachAction = page.getByRole("button", { name: "Attach Dataset to a Project" });
  await expect(attachAction).toBeVisible();
  await expect(attachAction).toBeDisabled();
  await expect(
    page.getByText(
      "You must be an editor or administrator of a project to attach a dataset. Ask a project administrator to add you to one.",
    ),
  ).toBeVisible();
});

test("a refusal this client has no rule for is read in the Data Manager's own words", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, versionOnePath, testInfo);

  await page.getByText("Attach Dataset to a Project", { exact: true }).click();
  const attachDialog = page.getByRole("dialog", { name: attachDialogName });
  await attachDialog.getByLabel("Project").click();
  await page.getByRole("option", { name: partnerTarget }).click();
  await attachDialog.getByLabel("Path").fill("/inputs");

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/attach-failure?status=400`);
  await attachDialog.getByRole("button", { name: "Attach" }).click();

  // The Data Manager's own account of the refusal is read beside the choices that caused it, not
  // replaced by a sentence that says only that something went wrong.
  await expect(
    attachDialog.getByText(
      "fixture-rejected: the file type is not supported by this project. Nothing was attached and your choices are unchanged.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionOnePath}`);
  await expect(attachDialog.getByLabel("Project")).toHaveText(partnerTarget);
  await expect(attachDialog.getByLabel("Path")).toHaveValue("/inputs");

  // The same choices still attach once the refusal is lifted, so nothing about them was at fault.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/attach-failure`);
  await attachDialog.getByRole("button", { name: "Attach" }).click();
  await expect(attachDialog.getByText(`Attached to ${partnerTarget}.`)).toBeVisible({
    timeout: 20_000,
  });
});

test("a project read that failed is told apart from one still arriving", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-collection-failure?status=503`,
  );
  await login(page, versionOnePath, testInfo);

  const attachAction = page.getByRole("button", { name: "Attach Dataset to a Project" });
  await expect(attachAction).toBeVisible();
  await expect(attachAction).toBeDisabled();
  // A read that failed will not answer on its own, so once it has stopped retrying the caller is
  // told to reload rather than to wait for a confirmation that is never going to arrive.
  await expect(
    page.getByText(
      "Your projects could not be read, so the projects you can attach to are unknown. Reload to try again.",
    ),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText("Project membership is still being confirmed.", { exact: false }),
  ).toHaveCount(0);
  // The action is never claimed to have no targets, which is a fact only a read that answered has.
  await expect(page.getByText("You must be an editor or administrator of a project")).toHaveCount(
    0,
  );
});

test("a refused, failed, or unreadable attachment keeps the version, the choices, and the work done", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, versionOnePath, testInfo);

  await page.getByText("Attach Dataset to a Project", { exact: true }).click();
  const attachDialog = page.getByRole("dialog", { name: attachDialogName });
  await attachDialog.getByLabel("Project").click();
  await page.getByRole("option", { name: partnerTarget }).click();
  await attachDialog.getByLabel("Path").fill("/inputs");

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/attach-failure?status=403`);
  await attachDialog.getByRole("button", { name: "Attach" }).click();
  await expect(
    attachDialog.getByText(
      `You are not allowed to attach dataset ${fixtureIds.dataset} version 1 to Partner Project. Nothing was attached and your choices are unchanged.`,
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${versionOnePath}`);
  await expect(attachDialog.getByLabel("Project")).toHaveText(partnerTarget);
  await expect(attachDialog.getByLabel("Path")).toHaveValue("/inputs");

  // A task that settles with anything but success is a failure of the attachment, not of its request.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/attach-failure`);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/attach-exit-code?value=5`);
  await attachDialog.getByRole("button", { name: "Attach" }).click();
  await expect(
    attachDialog.getByText("Dataset attachment task failed with exit code 5.", { exact: false }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(attachDialog.getByLabel("Path")).toHaveValue("/inputs");

  // A task this client could not read is not an outcome, so the accepted work is retried rather
  // than sent again.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/attach-exit-code`);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await attachDialog.getByRole("button", { name: "Attach" }).click();
  await expect(
    attachDialog.getByText(
      `Could not attach dataset ${fixtureIds.dataset} version 1 to Partner Project. Nothing was attached and your choices are unchanged; retry is available.`,
    ),
  ).toBeVisible({ timeout: 20_000 });

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/task-failure`);
  await attachDialog.getByRole("button", { name: "Attach" }).click();
  await expect(attachDialog.getByText(`Attached to ${partnerTarget}.`)).toBeVisible({
    timeout: 20_000,
  });

  // Three requests reached the Data Manager: the refused one, the one whose task failed, and the
  // one whose task could not be read — which the successful retry reused rather than repeated.
  const diagnostics = await attachmentDiagnostics(request, subject);
  expect(diagnostics.attachments).toHaveLength(3);
  expect(
    diagnostics.requests.filter(({ method, path }) => method === "POST" && path === "/file"),
  ).toHaveLength(3);
});

test("the dataset file name is drawn in the application's own link colour", async ({
  page,
}, testInfo) => {
  await login(page, "datasets", testInfo);

  // The brand's link colour, not the blue a browser paints an anchor the application never styled.
  await expect(page.getByRole("link", { name: "acceptance-dataset-v2.sdf" })).toHaveCSS(
    "color",
    await linkColour(page),
  );
});
