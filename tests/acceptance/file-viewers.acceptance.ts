import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const files = `projects/${fixtureIds.project}/files`;
const notesView = `${files}/view?path=%2Fnotes.txt`;
const posesView = `${files}/view?path=%2Finputs%2Fposes.sdf`;
const notesTransport = `/data-manager-ui/api/viewer-proxy/project/${fixtureIds.project}/file?path=%2F&file=notes.txt`;
const notesDownload = `/data-manager-ui/api/dm-api/project/${fixtureIds.project}/file?path=%2F&file=notes.txt`;

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}`);
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.11.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

const transportUrl = (href: string) => new URL(href, acceptanceUrls.app).toString();

test("a file's viewers are addressed beneath the project that holds it", async ({
  page,
}, testInfo) => {
  await login(page, files, testInfo);
  await page.getByRole("button", { exact: true, name: "notes.txt" }).click();

  // Every viewer the file offers is its own canonical Files route, carrying the file's path and
  // the viewer and nothing else.
  await expect(page.getByRole("link", { name: "Plaintext Viewer" })).toHaveAttribute(
    "href",
    `/data-manager-ui/${notesView}`,
  );
  await expect(page.getByRole("link", { name: "Browser Viewer" })).toHaveAttribute(
    "href",
    `/data-manager-ui/${notesView}&viewer=browser`,
  );
  await page.getByRole("link", { name: "Plaintext Viewer" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${notesView}`);
  await expect(page.getByText("acceptance notes.txt", { exact: true })).toBeVisible();
  // The project workspace is retained around the file rather than replaced by a standalone page.
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  // A refresh preserves the exact viewer identity.
  await page.reload();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${notesView}`);
  await expect(page.getByText("acceptance notes.txt", { exact: true })).toBeVisible();

  // Switching viewers replaces the file's own route, so the file, the project, and the directory
  // it is in are all unchanged, and only the viewer differs.
  await page.getByRole("link", { name: "Browser Viewer" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${notesView}&viewer=browser`);
  const frame = page.locator('iframe[title="notes.txt in the browser viewer"]');
  await expect(frame).toHaveAttribute("src", notesTransport);
  await expect(page.getByRole("link", { name: "Open in a new tab" })).toHaveAttribute(
    "href",
    notesTransport,
  );
  await expect(
    page.frameLocator('iframe[title="notes.txt in the browser viewer"]').locator("body"),
  ).toContainText("acceptance notes.txt");

  // Back leaves the file for the listing it was opened from, whichever viewer it ended up in.
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${files}`);
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();

  // An explicit return does the same, from the directory the file is actually in.
  await page.goto(`${posesView}`);
  await page.getByRole("link", { name: "Back to files" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${files}?path=%2Finputs`);
  await expect(page.getByRole("button", { exact: true, name: "poses.sdf" })).toBeVisible();
});

test("a viewer entered directly authenticates into its own project and transport", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, `${notesView}&unowned=ignored&viewer=text`, testInfo);

  // Authentication returns to the exact file, the state the section does not own is removed, and
  // the viewer every file offers is the section's default rather than a value the URL carries.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${notesView}`);
  await expect(page.getByText("acceptance notes.txt", { exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  // Both transports serve the same file's bytes; the browser viewer forces inline display.
  const download = await page.request.get(transportUrl(notesDownload));
  expect(download.status()).toBe(200);
  expect(await download.text()).toBe("acceptance notes.txt");
  const browserView = await page.request.get(transportUrl(notesTransport));
  expect(browserView.status()).toBe(200);
  expect(browserView.headers()["content-disposition"]).toBe("inline");
  expect(await browserView.text()).toBe("acceptance notes.txt");

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) => response.json() as Promise<{ requests: { path: string; query: string }[] }>,
    );
  const reads = diagnostics.requests.filter(
    ({ path }) => path === `/project/${fixtureIds.project}/file`,
  );
  expect(reads.length).toBeGreaterThanOrEqual(1);
  for (const read of reads) {
    expect(read.query).toContain("file=notes.txt");
  }
});

test("a file the project does not hold, or will not disclose, is a Files-local outcome", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, notesView, testInfo);
  await expect(page.getByText("acceptance notes.txt", { exact: true })).toBeVisible();

  const missing = await page.goto(`${files}/view?path=%2Finputs%2Fabsent.txt`);
  expect(missing?.status()).toBe(404);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${files}/view?path=%2Finputs%2Fabsent.txt`);
  await expect(page.getByText("This file was not found in this project.")).toBeVisible();
  // The valid project shell, the file's own directory, and a usable listing are all retained.
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "poses.sdf" })).toBeVisible();

  // A file the Data Manager refuses answers exactly as one it does not hold, in the response as
  // well as the page, so the viewer cannot be used to discover which files a project holds.
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/file-content-failure?status=403`,
  );
  const denied = await page.goto(notesView);
  expect(denied?.status()).toBe(missing?.status());
  await expect(page.getByText("This file was not found in this project.")).toBeVisible();
  await expect(page.getByText("acceptance notes.txt", { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${notesView}`);

  // A viewer that would have fetched the file itself is told the same thing before it is framed,
  // so a refusal never reaches the caller as a proxy error inside a frame.
  const deniedInBrowser = await page.goto(`${notesView}&viewer=browser`);
  expect(deniedInBrowser?.status()).toBe(missing?.status());
  await expect(page.getByText("This file was not found in this project.")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${notesView}&viewer=browser`);
});

test("content that could not be delivered stays retryable at the same file", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  for (const status of [429, 503]) {
    await request.post(
      `${acceptanceUrls.control}/scenario/${subject}/file-content-failure?status=${status}`,
    );
    await (status === 429 ? login(page, notesView, testInfo) : page.goto(notesView));

    // Nothing claims the file is gone, and the file's own URL is what a retry addresses.
    await expect(
      page.getByText("This file's content could not be loaded. Retry this exact file."),
      String(status),
    ).toBeVisible();
    await expect(page.getByText("This file was not found in this project.")).toHaveCount(0);
    await expect(page).toHaveURL(`${acceptanceUrls.app}${notesView}`);
  }

  // A viewer that fetches its own bytes is retried on the same terms rather than framing an error.
  await page.goto(`${posesView}&viewer=browser`);
  await expect(
    page.getByText("This file's content could not be loaded. Retry this exact file."),
  ).toBeVisible();
  await expect(page.getByText("This file was not found in this project.")).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${posesView}&viewer=browser`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/file-content-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.locator('iframe[title="poses.sdf in the browser viewer"]')).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${posesView}&viewer=browser`);

  await page.goto(notesView);
  await expect(page.getByText("acceptance notes.txt", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${notesView}`);
});
