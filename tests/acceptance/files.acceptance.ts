import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";
import { linkColour } from "./theme";

test.describe.configure({ mode: "serial" });

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

const acceptanceFiles = `projects/${fixtureIds.project}/files`;
const screeningFiles = `projects/${fixtureIds.screeningProject}/files`;

type Diagnostics = { requests: { method: string; path: string; query: string }[] };

const fileRequests = async (
  request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> },
  subject: string,
) => {
  const diagnostics = (await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json())) as Diagnostics;
  return diagnostics.requests.filter(({ path }) => path === "/file" || path.startsWith("/path"));
};

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

const row = (page: Page, name: string) => page.getByRole("row").filter({ hasText: name });

test("the listing belongs to the project and the path in the URL", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceFiles, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);
  await expect(page.getByRole("heading", { level: 1, name: "Files" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();

  // The project root lists its own directories first, then the files it holds.
  await expect(page.getByRole("link", { exact: true, name: "inputs" })).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "acceptance-dataset-v2.sdf" }),
  ).toBeVisible();
  // How a file is held comes from the generated resource, not from its name.
  await expect(row(page, "notes.txt").getByText("unmanaged")).toBeVisible();
  await expect(row(page, "acceptance-dataset-v2.sdf").getByText("immutable")).toBeVisible();

  // Every listing read named the project in the URL and the path Files owns.
  const reads = await fileRequests(request, subject);
  expect(reads.length).toBeGreaterThanOrEqual(1);
  for (const read of reads) {
    expect(read.query).toContain(`project_id=${fixtureIds.project}`);
  }

  // A second project lists its own files rather than inheriting the first project's.
  await page.goto(screeningFiles);
  await expect(page.getByText("Screening Project", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "screening-library.sdf" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toHaveCount(0);
  const afterSecond = await fileRequests(request, subject);
  expect(
    afterSecond.some(({ query }) => query.includes(`project_id=${fixtureIds.screeningProject}`)),
  ).toBe(true);
  expect(afterSecond.filter(({ query }) => !query.includes("project_id="))).toEqual([]);
});

test("the path is owned by Files, canonical in the URL, and restored by history", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceFiles, testInfo);

  // Entering a directory writes the path Files owns into the URL.
  await page.getByRole("link", { exact: true, name: "inputs" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}?path=%2Finputs`);
  await expect(page.getByRole("button", { exact: true, name: "poses.sdf" })).toBeVisible();
  // A file that only describes another file is listed beneath the file it describes.
  await expect(page.getByRole("button", { exact: true, name: "poses.schema.json" })).toHaveCount(0);

  await page.getByRole("link", { exact: true, name: "ligands" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}?path=%2Finputs%2Fligands`);

  // A breadcrumb addresses its own directory of the same project and carries nothing else.
  await page
    .getByRole("navigation", { name: "Path" })
    .getByRole("link", { exact: true, name: "root" })
    .click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();

  // Back and Forward restore the exact prior path.
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}?path=%2Finputs%2Fligands`);
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);

  // A non-canonical spelling of a directory is replaced by the one canonical URL for it.
  await page.goto(`${acceptanceFiles}?path=%2Finputs%2F`);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}?path=%2Finputs`);
  await page.goto(`${acceptanceFiles}?path=%2F&unknown=leaked`);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);
});

test("the path Files owns never reaches another section", async ({ page }, testInfo) => {
  await login(page, `${acceptanceFiles}?path=%2Finputs`, testInfo);
  await expect(page.getByRole("button", { exact: true, name: "poses.sdf" })).toBeVisible();

  for (const [label, section] of [
    ["Run", "run"],
    ["Results", "results"],
    ["Manage", "manage"],
  ] as const) {
    await page.goto(`${acceptanceFiles}?path=%2Finputs`);
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/${section}`);
  }

  // Returning to Files starts from the section's own default rather than the path it last had.
  await page.getByRole("link", { name: "Files", exact: true }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);
});

test("a path the project does not hold is a Files-local outcome", async ({ page }, testInfo) => {
  const missing = `${acceptanceFiles}?path=%2Fnowhere`;
  await login(page, missing, testInfo);

  // The URL is not corrected and the project shell stays exactly where it was.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${missing}`);
  await expect(
    page.getByText("This directory is unavailable or you no longer have access to it."),
  ).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Files" })).toBeVisible();

  // Nothing is known about what this directory holds, so nothing can be changed in it either.
  await expect(
    page.getByText(
      "This directory is unavailable, so changing its contents cannot be established as safe.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload unmanaged file" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Create directory" })).toBeDisabled();

  // A breadcrumb out of the missing directory still works, so the caller is never stranded.
  await page
    .getByRole("navigation", { name: "Path" })
    .getByRole("link", { exact: true, name: "root" })
    .click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();
});

test("a file path the section cannot address keeps the project shell", async ({
  page,
}, testInfo) => {
  const unusable = `${acceptanceFiles}/view?path=inputs%2Fposes.sdf`;
  await login(page, unusable, testInfo);

  // The route reaches Files rather than the application's own not-found, so the project it names
  // stays on screen and Files answers for the file it could not address.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unusable}`);
  await expect(page.getByText("This file was not found in this project.")).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Files" })).toBeVisible();

  // The section keeps its own root listing rather than guessing a correction for the file path.
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "inputs" })).toBeVisible();
});

test("creating, uploading, renaming, and deleting act on the addressed directory", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, `${acceptanceFiles}?path=%2Finputs`, testInfo);
  await expect(page.getByRole("button", { exact: true, name: "poses.sdf" })).toBeVisible();

  // A directory is created inside the directory being displayed.
  await page.getByRole("button", { name: "Create directory" }).click();
  await page.getByLabel("Directory Name").fill("results");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("results was created.")).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "results" })).toBeVisible();

  const creations = (await fileRequests(request, subject)).filter(
    ({ method, path }) => path === "/path" && method === "PUT",
  );
  expect(creations).toHaveLength(1);
  expect(creations[0].query).toContain(`project_id=${fixtureIds.project}`);
  expect(creations[0].query).toContain("path=%2Finputs%2Fresults");

  // A name the directory already holds is reported rather than sent.
  await page.getByRole("button", { name: "Create directory" }).click();
  await page.getByLabel("Directory Name").fill("results");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("This directory already exists.")).toBeVisible();
  expect(
    (await fileRequests(request, subject)).filter(
      ({ method, path }) => path === "/path" && method === "PUT",
    ),
  ).toHaveLength(1);

  // Renaming a directory refreshes the listing that displays it, not the directory itself, so the
  // new name replaces the old one on screen without the caller refreshing.
  await row(page, "results").getByRole("button", { name: "Rename or move" }).click();
  await page.getByLabel("Destination Path").fill("inputs/outcomes");
  await page.getByRole("button", { name: "Rename / Move" }).last().click();
  await expect(page.getByText("The directory was renamed or moved.")).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "outcomes" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "results" })).toHaveCount(0);

  const directoryMoves = (await fileRequests(request, subject)).filter(
    ({ method, path }) => path === "/path/move" && method === "PUT",
  );
  expect(directoryMoves).toHaveLength(1);
  expect(directoryMoves[0].query).toContain("src_path=%2Finputs%2Fresults");
  expect(directoryMoves[0].query).toContain("dst_path=%2Finputs%2Foutcomes");

  // An upload lands in the project and directory on screen.
  await page.getByRole("button", { name: "Upload unmanaged file" }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles({ buffer: Buffer.from("data"), mimeType: "text/plain", name: "upload.txt" });
  await expect(page.getByText("upload.txt was uploaded.")).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "upload.txt" })).toBeVisible();

  // Renaming moves the file out of the directory, and the listing it left says so.
  await row(page, "upload.txt").getByRole("button", { name: "Rename or move" }).click();
  await page.getByLabel("Destination Path").fill("renamed.txt");
  await page.getByRole("button", { name: "Rename / Move" }).last().click();
  await expect(page.getByText("The file was renamed or moved.")).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "upload.txt" })).toHaveCount(0);
  await page.goto(acceptanceFiles);
  await expect(page.getByRole("button", { exact: true, name: "renamed.txt" })).toBeVisible();

  // Deleting an unmanaged file removes it from the directory it was in.
  await row(page, "renamed.txt").getByRole("button", { name: "Delete unmanaged file" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("renamed.txt was deleted.")).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "renamed.txt" })).toHaveCount(0);
});

test("a managed file is detached and a dataset can be made from an unmanaged one", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceFiles, testInfo);

  // A dataset made from a project file is billed to the project's own containing unit.
  await row(page, "notes.txt")
    .getByRole("button", { name: "Create a dataset from this file" })
    .click();
  await expect(page.getByText("A dataset was created from notes.txt.")).toBeVisible();

  // A managed file the Data Manager has fixed is already a dataset version, so no dataset is made
  // from it and there is nothing to rename; detaching the project's link to it is all it offers.
  const managed = row(page, "acceptance-dataset-v2.sdf");
  await expect(managed.getByRole("button", { name: "Rename or move" })).toHaveCount(0);
  await expect(
    managed.getByRole("button", { name: "Create a dataset from this file" }),
  ).toHaveCount(0);
  await managed.getByRole("button", { name: "Detach file" }).click();
  await page.getByRole("button", { name: "Detach" }).click();
  await expect(
    page.getByText("acceptance-dataset-v2.sdf was detached from this project."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "acceptance-dataset-v2.sdf" }),
  ).toHaveCount(0);
});

test("favourites are keyed by the project whose files they are", async ({ page }, testInfo) => {
  await login(page, acceptanceFiles, testInfo);

  await row(page, "notes.txt").getByRole("button", { name: "Favourite notes.txt" }).click();
  await expect(
    row(page, "notes.txt").getByRole("button", { name: "Unfavourite notes.txt" }),
  ).toBeVisible();

  // Another project's listing does not inherit it, and returning restores the project's own. The
  // project is changed the only way the application offers — back out to the index and enter the
  // other one — so nothing here depends on a reload clearing what was remembered.
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { exact: true, name: "Projects" })
    .click();
  await page.getByRole("link", { name: /Screening Project/u }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${screeningFiles}`);
  await expect(
    row(page, "screening-library.sdf").getByRole("button", {
      name: "Favourite screening-library.sdf",
    }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { exact: true, name: "Projects" })
    .click();
  await page.getByRole("link", { name: /Acceptance Project/u }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);
  await expect(
    row(page, "notes.txt").getByRole("button", { name: "Unfavourite notes.txt" }),
  ).toBeVisible();
});

test("a project observer browses files and is told what changing them requires", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, acceptanceFiles, testInfo);

  // Reading the project's files is not withheld along with changing them.
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "inputs" })).toBeVisible();
  await expect(
    page.getByText("You must be a project editor or administrator to change project files."),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Upload unmanaged file" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Create directory" })).toBeDisabled();
  await expect(
    row(page, "notes.txt").getByRole("button", { name: "Delete unmanaged file" }),
  ).toBeDisabled();
  await expect(
    row(page, "notes.txt").getByRole("button", { name: "Rename or move" }),
  ).toBeDisabled();
  // Favouriting and downloading change nothing in the Data Manager, so they stay available.
  await expect(
    row(page, "notes.txt").getByRole("button", { name: "Favourite notes.txt" }),
  ).toBeEnabled();
});

test("a listing that cannot be refreshed is marked stale, locked, and retryable", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, acceptanceFiles, testInfo);
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/files-failure?status=503`);
  await page.getByRole("button", { name: "Refresh this directory" }).click();

  await expect(
    page.getByText(
      "This directory could not be refreshed. It may be out of date, so nothing in it can be changed until it loads again.",
    ),
  ).toBeVisible();
  // The content it left is still worth reading, so it stays, but nothing in it can be changed.
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();
  await expect(
    page.getByText(
      "This directory could not be refreshed, so changing its contents cannot be established as safe.",
    ),
  ).toBeVisible();
  await expect(
    row(page, "notes.txt").getByRole("button", { name: "Delete unmanaged file" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Upload unmanaged file" })).toBeDisabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  // Retrying recovers everything in place, without any change of project or path.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/files-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(
    row(page, "notes.txt").getByRole("button", { name: "Delete unmanaged file" }),
  ).toBeEnabled();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);
});

test("a refused file change is reported in place and never reported as done", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/file-mutation-failure?status=403`,
  );
  await login(page, acceptanceFiles, testInfo);
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();

  await row(page, "notes.txt").getByRole("button", { name: "Delete unmanaged file" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();

  // The rejection is feedback where the control is: the file, the project, and the route survive.
  await expect(page.getByText(/You cannot delete the file notes\.txt/u)).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${acceptanceFiles}`);

  // Retrying in place succeeds once the Data Manager allows it.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/file-mutation-failure`);
  await row(page, "notes.txt").getByRole("button", { name: "Delete unmanaged file" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("notes.txt was deleted.")).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toHaveCount(0);
});

test("a listing draws its directories and its files as the same kind of link", async ({
  page,
}, testInfo) => {
  await login(page, acceptanceFiles, testInfo);

  // Both rows address something the caller can open, so a directory is no less a link than the
  // file beside it and is drawn in the same colour.
  const colour = await linkColour(page);
  await expect(page.getByRole("link", { exact: true, name: "inputs" })).toHaveCSS("color", colour);
  await expect(page.getByRole("button", { exact: true, name: "notes.txt" })).toHaveCSS(
    "color",
    colour,
  );
});
