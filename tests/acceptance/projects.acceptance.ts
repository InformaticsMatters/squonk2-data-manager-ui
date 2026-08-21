import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { PROJECT_CREATION_RECOVERY_KEY } from "../../src/projects/projectCreation";
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

test("Project index rows state role and privacy, and the unit filter narrows them", async ({
  page,
}, testInfo) => {
  await login(page, "projects", testInfo);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  // The strongest role held, and nothing at all where none is held.
  const administered = page.getByRole("link", { name: /Acceptance Project/u });
  await expect(administered).toContainText("Administrator");
  await expect(administered.getByRole("img", { name: "Private" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Screening Project/u })).toContainText("Observer");
  const unheld = page.getByRole("link", { name: /Unlisted Unit Project/u });
  await expect(unheld).not.toContainText(/Administrator|Editor|Observer/u);
  await expect(unheld.getByRole("img", { name: "Public" })).toBeVisible();

  // Exactly the units holding a project, counted — including the one the caller's own unit index
  // cannot name, which is offered under the same label its rows carry.
  await page.getByLabel("Unit").click();
  await expect(page.getByRole("option", { name: "Acceptance Unit (2)" })).toBeVisible();
  await expect(
    page.getByRole("option", { name: `Unit ${fixtureIds.unlistedUnit} (1)` }),
  ).toBeVisible();
  await page.getByRole("option", { name: "Screening Unit (2)" }).click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}projects?unit=${fixtureIds.otherUnit}`);
  await expect(page.getByRole("link", { name: /Screening Project/u })).toBeVisible();
  await expect(page.getByRole("link", { name: /Acceptance Project/u })).toHaveCount(0);

  // The narrowed view is the URL's, so it survives a reload as a shared link would.
  await page.reload();
  await expect(page.getByRole("link", { name: /Screening Project/u })).toBeVisible();
  await expect(page.getByRole("link", { name: /Acceptance Project/u })).toHaveCount(0);

  // A search matching nothing inside the unit names the unit, and offers the way out where the
  // emptiness is reported.
  await page.getByLabel("Search projects").fill("Acceptance Project");
  await expect(page.getByText("No projects match this search in Screening Unit.")).toBeVisible();
  await page.getByRole("button", { name: "Show all units" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects?search=Acceptance+Project`);
  await expect(page.getByRole("link", { name: /Acceptance Project/u })).toBeVisible();

  // A link naming a unit holding no project the caller can see is the whole list, not an empty one.
  await page.goto(`projects?unit=${fixtureIds.personalUnit}`);
  await expect(page.getByRole("link", { name: /Acceptance Project/u })).toBeVisible();
  await expect(page.getByRole("link", { name: /Screening Project/u })).toBeVisible();
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

test("project creation refreshes and retries with one unclaimed subscription", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-creation-failure?status=503`,
  );
  await login(page, "projects/new", testInfo);

  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Recoverable Project");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("switch", { name: "Private project" }).click();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByText(/Subscription product-0c0c0c0c/u)).toBeVisible();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}projects/new?subscription=${fixtureIds.createdProduct}`,
  );
  let diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
    );
  expect(
    diagnostics.requests.filter(
      ({ method, path }) => method === "POST" && path === `/product/unit/${fixtureIds.unit}`,
    ),
  ).toHaveLength(1);
  expect(
    diagnostics.requests.filter(({ method, path }) => method === "POST" && path === "/project"),
  ).toHaveLength(1);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-creation-failure`);
  await page.reload();
  await expect(page.getByLabel("Project name")).toHaveValue("Recoverable Project");
  await expect(page.getByRole("switch", { name: "Private project" })).not.toBeChecked();
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.createdProject}/files`);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
    );
  expect(
    diagnostics.requests.filter(
      ({ method, path }) => method === "POST" && path === `/product/unit/${fixtureIds.unit}`,
    ),
  ).toHaveLength(1);
  expect(
    diagnostics.requests.filter(({ method, path }) => method === "POST" && path === "/project"),
  ).toHaveLength(2);
});

for (const cleanupFails of [false, true]) {
  test(`cancelling partial project creation ${cleanupFails ? "exposes failed cleanup" : "removes its subscription"}`, async ({
    page,
    request,
  }, testInfo) => {
    const subject = subjectFor(testInfo);
    await request.post(
      `${acceptanceUrls.control}/scenario/${subject}/project-creation-failure?status=503`,
    );
    if (cleanupFails) {
      await request.post(
        `${acceptanceUrls.control}/scenario/${subject}/cleanup-failure?status=503`,
      );
    }
    await login(page, "projects/new", testInfo);
    await page.getByLabel("Containing unit").click();
    await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
    await page.getByLabel("Project name").fill("Cancelled Project");
    await page.getByLabel("Tier").click();
    await page.getByRole("option", { name: "Bronze" }).click();
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText(/will be reused/u)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/Retry it or cancel and clean up/u)).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    if (cleanupFails) {
      await expect(page.getByText(/Subscription ID: product-0c0c0c0c/u)).toBeVisible();
      await expect(page.getByRole("link", { name: "Open it in Administration" })).toHaveAttribute(
        "href",
        `/data-manager-ui/administration/subscriptions/${fixtureIds.createdProduct}`,
      );
      // A failed cleanup ends the attempt rather than outliving it: the canonical route collects a
      // new one instead of sending every later visit back to a subscription it cannot finish.
      await page.getByRole("button", { name: "Back to Projects" }).click();
      await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
      await page.goto("projects/new");
      await expect(page).toHaveURL(`${acceptanceUrls.app}projects/new`);
      await expect(page.getByLabel("Project name")).toHaveValue("");
      await expect(page.getByRole("button", { name: "Create project" })).toBeVisible();
    } else {
      await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
    }

    const diagnostics = await request
      .get(`${acceptanceUrls.control}/scenario/${subject}`)
      .then(
        (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
      );
    expect(
      diagnostics.requests.filter(
        ({ method, path }) =>
          method === "DELETE" && path === `/product/${fixtureIds.createdProduct}`,
      ),
    ).toHaveLength(1);
  });
}

test("cancelling a handed-off partial failure leaves its subscription to Administration", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-creation-failure?status=503`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Handed Off Project");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText(/will be reused/u)).toBeVisible();

  // Forgetting this session's record is what makes the next visit a genuine Administration handoff
  // rather than this workflow resuming a subscription it remembers creating.
  await page.evaluate((key) => sessionStorage.removeItem(key), PROJECT_CREATION_RECOVERY_KEY);
  await page.goto(`administration/subscriptions/${fixtureIds.createdProduct}`);
  await page.getByRole("link", { name: "Create linked project" }).click();
  await page.getByRole("button", { name: "Create linked project" }).click();
  await expect(page.getByText(/will be reused/u)).toBeVisible();

  // A subscription this workflow did not create is never cleaned up by it. Cancelling releases the
  // attempt and says so: the subscription outlived it, so its identity and the route that owns it
  // are stated before the caller leaves, and a later visit still collects a new attempt.
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText(/Subscription ID: product-0c0c0c0c/u)).toBeVisible();
  await expect(page.getByRole("link", { name: "Open it in Administration" })).toHaveAttribute(
    "href",
    `/data-manager-ui/administration/subscriptions/${fixtureIds.createdProduct}`,
  );
  await page.getByRole("button", { name: "Back to Projects" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  await page.goto("projects/new");
  await expect(page.getByLabel("Project name")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Create project" })).toBeVisible();

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
    );
  expect(
    diagnostics.requests.filter(
      ({ method, path }) => method === "DELETE" && path === `/product/${fixtureIds.createdProduct}`,
    ),
  ).toHaveLength(0);
});

test("an unavailable subscription service retains the form without a blind retry", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/product-creation-failure?status=503`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Unavailable Subscription");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();

  // A `5xx` can be a gateway answering for a service that already committed, so its outcome is no
  // more confirmed than a timeout's and it is refused the retry a `403` is offered.
  await expect(page.getByText(/subscription service is unavailable/u)).toBeVisible();
  await expect(page.getByLabel("Project name")).toHaveValue("Unavailable Subscription");
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Subscriptions" })).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  await page.goto("projects/new");
  await expect(page.getByLabel("Project name")).toHaveValue("");
});

test("a rejected subscription request retains the form and retries only after a confirmed response", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/product-creation-failure?status=429`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Retained Product Form");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Silver" }).click();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(
    page.getByText("The subscription service is busy. Wait briefly and retry."),
  ).toBeVisible();
  await expect(page.getByLabel("Project name")).toHaveValue("Retained Product Form");
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/product-creation-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.createdProject}/files`);
});

test("a claimed subscription handoff is rejected without creating anything", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, `projects/new?subscription=${fixtureIds.product}`, testInfo);
  await expect(page.getByText("This subscription is already linked to a project.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create project" })).toBeDisabled();

  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
    );
  expect(
    diagnostics.requests.filter(({ method, path }) => method === "POST" && path === "/project"),
  ).toHaveLength(0);
});

test("first-attempt project creation enters Files only after both services succeed", async ({
  page,
}, testInfo) => {
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("First Attempt Project");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.createdProject}/files`);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
});

test("an evaluator can create only an evaluation project in their personal unit", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.put(`${acceptanceUrls.control}/scenario/${subject}?profile=evaluator`);
  await login(page, "projects/new", testInfo);

  await page.getByLabel("Containing unit").click();
  await expect(
    page.getByRole("option", { name: `Default Organisation / ${subject}` }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }),
  ).toHaveCount(0);
  await page.getByRole("option", { name: `Default Organisation / ${subject}` }).click();
  await page.getByLabel("Tier").click();
  await expect(page.getByRole("option", { name: "Evaluation" })).toBeEnabled();
  await expect(page.getByRole("option", { name: "Bronze" })).toHaveCount(0);
});

test("refresh during subscription creation retains the form and cannot duplicate the request", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/product-creation-delay?milliseconds=1500`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Pending Subscription");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), PROJECT_CREATION_RECOVERY_KEY))
    .toContain('"kind":"product-requested"');

  await page.reload();
  await expect(page.getByLabel("Project name")).toHaveValue("Pending Subscription");
  await expect(page.getByText(/outcome could not be confirmed/u)).toBeVisible();
  await expect(page.getByRole("button", { name: "Create project" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);

  await expect
    .poll(async () => {
      const diagnostics = await request
        .get(`${acceptanceUrls.control}/scenario/${subject}`)
        .then(
          (response) =>
            response.json() as Promise<{ requests: { method: string; path: string }[] }>,
        );
      return diagnostics.requests.filter(
        ({ method, path }) => method === "POST" && path === `/product/unit/${fixtureIds.unit}`,
      ).length;
    })
    .toBe(1);
});

test("refresh after a committed project response is lost reconciles its claim into Files", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-creation-response-delay?milliseconds=1500`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Committed Project");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}projects/new?subscription=${fixtureIds.createdProduct}`,
  );
  await expect
    .poll(async () => {
      const diagnostics = await request
        .get(`${acceptanceUrls.control}/scenario/${subject}`)
        .then(
          (response) =>
            response.json() as Promise<{ requests: { method: string; path: string }[] }>,
        );
      return diagnostics.requests.some(
        ({ method, path }) => method === "POST" && path === "/project",
      );
    })
    .toBe(true);

  await page.reload();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.createdProject}/files`);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
});

test("retry after a committed project response is lost reconciles before posting again", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-creation-response-delay?milliseconds=1500`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Reconciled Retry");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText(/project request timed out/u)).toBeVisible();

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.createdProject}/files`);
  const diagnostics = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then(
      (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
    );
  expect(
    diagnostics.requests.filter(({ method, path }) => method === "POST" && path === "/project"),
  ).toHaveLength(1);
});

test("Administration offers an omitted-claim subscription to the canonical recovery workflow", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-creation-failure?status=503`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Administration Handoff");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText(/will be reused/u)).toBeVisible();

  await page.goto(`administration/subscriptions/${fixtureIds.createdProduct}`);
  await page.getByRole("link", { name: "Create linked project" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}projects/new?subscription=${fixtureIds.createdProduct}`,
  );
  await expect(page.getByLabel("Project name")).toHaveValue("Administration Handoff");
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("an ambiguous subscription transport failure cannot be blindly resubmitted", async ({
  page,
}, testInfo) => {
  await page.route(`**/product/unit/${fixtureIds.unit}`, async (route) => {
    if (route.request().method() === "POST") {
      await route.abort("connectionfailed");
      return;
    }
    await route.continue();
  });
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Ambiguous Product");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByText(/could not reach the service/u)).toBeVisible();
  await expect(page.getByLabel("Project name")).toHaveValue("Ambiguous Product");
  await expect(page.getByRole("button", { name: "Create project" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Subscriptions" })).toBeVisible();

  // An unconfirmed request is refused a blind retry, not held onto for ever: cancelling abandons it
  // and the canonical route collects a new attempt rather than replaying the ambiguous one.
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  await page.goto("projects/new");
  await expect(page.getByLabel("Project name")).toHaveValue("");
  await expect(page.getByText(/could not reach the service/u)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create project" })).toBeVisible();
});

test("a timed-out subscription request retains its form without blind retry", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/product-creation-delay?milliseconds=1500`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Timed Out Subscription");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByText(/subscription request timed out/u)).toBeVisible();
  await expect(page.getByLabel("Project name")).toHaveValue("Timed Out Subscription");
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
});

test("a forbidden subscription response retains state for a deliberate retry", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/product-creation-failure?status=403`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Forbidden Subscription");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByText(/did not allow this subscription/u)).toBeVisible();
  await expect(page.getByLabel("Project name")).toHaveValue("Forbidden Subscription");
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  await page.goto("projects/new");
  await expect(page.getByLabel("Project name")).toHaveValue("");
});

// The project leg answers with the same statuses the subscription leg does, and each has to leave
// the attempt recoverable against the one subscription that already exists.
for (const [status, reason] of [
  [403, "The server did not allow this project to be created. Review your access and retry."],
  [429, "The project service is busy. Wait briefly and retry."],
] as const) {
  test(`a ${status} project response retains the attempt against its one subscription`, async ({
    page,
    request,
  }, testInfo) => {
    const subject = subjectFor(testInfo);
    await request.post(
      `${acceptanceUrls.control}/scenario/${subject}/project-creation-failure?status=${status}`,
    );
    await login(page, "projects/new", testInfo);
    await page.getByLabel("Containing unit").click();
    await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
    await page.getByLabel("Project name").fill(`Project ${status}`);
    await page.getByLabel("Tier").click();
    await page.getByRole("option", { name: "Bronze" }).click();
    await page.getByRole("button", { name: "Create project" }).click();

    await expect(page.getByText(reason)).toBeVisible();
    await expect(page.getByLabel("Project name")).toHaveValue(`Project ${status}`);
    await expect(page.getByText(/will be reused/u)).toBeVisible();
    await expect(page).toHaveURL(
      `${acceptanceUrls.app}projects/new?subscription=${fixtureIds.createdProduct}`,
    );

    // The subscription is already bought, so retrying after the service answers differently sends
    // only the project request again.
    await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-creation-failure`);
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page).toHaveURL(
      `${acceptanceUrls.app}projects/${fixtureIds.createdProject}/files`,
    );

    const diagnostics = await request
      .get(`${acceptanceUrls.control}/scenario/${subject}`)
      .then(
        (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
      );
    expect(
      diagnostics.requests.filter(
        ({ method, path }) => method === "POST" && path === `/product/unit/${fixtureIds.unit}`,
      ),
    ).toHaveLength(1);
  });
}

test("a project domain failure keeps its subscription and exact service answer", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-creation-failure?status=400`,
  );
  await login(page, "projects/new", testInfo);
  await page.getByLabel("Containing unit").click();
  await page.getByRole("option", { name: "Acceptance Organisation / Acceptance Unit" }).click();
  await page.getByLabel("Project name").fill("Domain Failure");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByText("fixture-project-domain-failure")).toBeVisible();
  await expect(page.getByText(/will be reused/u)).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

for (const [productId, reason] of [
  [fixtureIds.storageProduct, "This subscription is not a project-tier subscription."],
  [fixtureIds.unlistedProduct, "You cannot create a project in this subscription's unit."],
] as const) {
  test(`an invalid ${productId} handoff remains diagnosable without mutation`, async ({
    page,
    request,
  }, testInfo) => {
    const subject = subjectFor(testInfo);
    await login(page, `projects/new?subscription=${productId}`, testInfo);
    await expect(page.getByText(reason)).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Subscriptions" })).toBeVisible();
    const diagnostics = await request
      .get(`${acceptanceUrls.control}/scenario/${subject}`)
      .then(
        (response) => response.json() as Promise<{ requests: { method: string; path: string }[] }>,
      );
    expect(
      diagnostics.requests.filter(({ method, path }) => method === "POST" && path === "/project"),
    ).toHaveLength(0);
  });
}

const managePath = `projects/${fixtureIds.project}/manage`;

/** Manage renders each fact as one list item whose text begins with that fact's label. */
const factRow = (page: Page, label: string) =>
  page.getByRole("listitem").filter({ hasText: new RegExp(`^${label}`, "u") });

/** Each project change Manage owns is one labelled region containing its control and its answer. */
const members = (page: Page, role: string) => page.getByRole("region", { name: role });
const privacyControl = (page: Page) => page.getByRole("region", { name: "Privacy" });
const privacySwitch = (page: Page) => privacyControl(page).getByRole("switch", { name: "Private" });

/** One member of a list, as the chip the control shows for them. */
const memberChip = (page: Page, role: string, username: string) =>
  members(page, role).getByRole("button", { name: username, exact: true });

const addMember = async (page: Page, role: string, username: string) => {
  await members(page, role).getByRole("combobox").click();
  await page.getByRole("option", { name: username, exact: true }).click();
};

/** The other way a name reaches a list: typed and committed, without choosing a listed option. */
const typeMember = async (page: Page, role: string, text: string) => {
  const combobox = members(page, role).getByRole("combobox");
  await combobox.click();
  await combobox.fill(text);
  await combobox.press("Enter");
};

/**
 * Holds the addressed project's next privacy change until the returned release is called, so a
 * command that has been sent and not yet answered is an observable state rather than a race. This
 * is the one fixture behaviour a scenario cannot carry: what is under test is how long the browser
 * waits, which only the browser's own view of the request can decide. Releasing also stops holding,
 * so a scenario the test moves on to is answered normally.
 */
const holdPrivacyChange = async (page: Page) => {
  const projectUrl = `${acceptanceUrls.dataManager}/project/${fixtureIds.project}`;
  const held = Promise.withResolvers<undefined>();
  await page.route(projectUrl, async (route) => {
    if (route.request().method() === "PATCH") {
      await held.promise;
    }
    await route.continue();
  });
  return async () => {
    held.resolve(undefined);
    await page.unroute(projectUrl);
  };
};

test("Manage presents project facts and available actions to a project administrator", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, managePath, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Acceptance Project" })).toBeVisible();
  await expect(page.getByText("Private", { exact: true }).first()).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Private");
  await expect(page.getByText("You have read-only access to this project.")).toHaveCount(0);

  await expect(factRow(page, "Your access")).toContainText("Administrator, Creator, Editor");
  await expect(factRow(page, "Containing unit")).toContainText("Acceptance Unit");
  await expect(factRow(page, "Owning organisation")).toContainText("Acceptance Organisation");
  await expect(memberChip(page, "Administrators", subject)).toBeVisible();
  await expect(memberChip(page, "Observers", `${subject}-observer`)).toBeVisible();

  // Manage owns these changes, so an administrator is offered the controls themselves.
  await expect(privacySwitch(page)).toBeEnabled();
  for (const role of ["Administrators", "Editors", "Observers"]) {
    await expect(members(page, role).getByRole("combobox")).toBeEnabled();
  }
  for (const label of ["Change files", "Run work"]) {
    await expect(factRow(page, label)).toContainText("Available to you.");
  }

  await expect(factRow(page, "Tier")).toContainText("Bronze");
  await expect(factRow(page, "Coin allowance")).toContainText("100");
  // Only a subscription that accounts for instances can be run against, so it says that it does.
  await expect(factRow(page, "Instance coins used")).toContainText("0");
  // Support owns every diagnostic identifier, so each is stated exactly once.
  await expect(factRow(page, "Project ID")).toContainText(fixtureIds.project);
  await expect(factRow(page, "Subscription ID")).toContainText(fixtureIds.product);
  await expect(factRow(page, "Unit ID")).toContainText(fixtureIds.unit);
  await expect(factRow(page, "Organisation ID")).toContainText(fixtureIds.organisation);
  await expect(page.getByRole("link", { name: "View subscription" })).toHaveAttribute(
    "href",
    `/data-manager-ui/administration/subscriptions/${fixtureIds.product}`,
  );

  // The one exclusively platform-administrator action is absent, not merely unavailable.
  await expect(page.getByRole("button", { name: "Take project administration" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Platform administration" })).toHaveCount(0);
});

test("Manage stays available to a project viewer and explains every unavailable action", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, managePath, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(factRow(page, "Your access")).toContainText("Observer");
  await expect(page.getByText("You have read-only access to this project.")).toBeVisible();

  // An ordinary unavailable control stays visible and disabled, with the reason beside it.
  await expect(privacySwitch(page)).toBeDisabled();
  await expect(
    privacyControl(page).getByText(
      "You must be a project administrator to change project privacy.",
    ),
  ).toBeVisible();
  for (const [role, requirement] of [
    ["Administrators", "administrators"],
    ["Editors", "editors"],
    ["Observers", "observers"],
  ]) {
    await expect(members(page, role).getByRole("combobox")).toBeDisabled();
    await expect(
      members(page, role).getByText(
        `You must be a project administrator to change project ${requirement}.`,
      ),
    ).toBeVisible();
  }
  // A viewer still reads the memberships they cannot change.
  await expect(memberChip(page, "Observers", subjectFor(testInfo))).toBeVisible();
  await expect(
    page.getByText("You must be a project administrator to delete this project."),
  ).toBeVisible();
  await expect(
    page.getByText("You must be a project editor or administrator to change project files."),
  ).toBeVisible();
  await expect(
    page.getByText("You must be a project editor or administrator to run work in this project."),
  ).toBeVisible();
  // Readable facts remain useful even though nothing here can be changed.
  await expect(factRow(page, "Tier")).toContainText("Bronze");
  await expect(page.getByRole("button", { name: "Take project administration" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Platform administration" })).toHaveCount(0);
});

test("the platform-administrator action is offered alone and its rejection changes nothing", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.put(`${acceptanceUrls.control}/scenario/${subject}?profile=platform-admin`);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure?status=403`,
  );
  await login(page, managePath, testInfo);

  const takeAdministration = page.getByRole("button", { name: "Take project administration" });
  await expect(takeAdministration).toBeEnabled();
  await expect(factRow(page, "Your access")).toContainText("No project role");
  // The realm role offers its own action alone; it is not ordinary authority over the project.
  await expect(page.getByText("You have read-only access to this project.")).toBeVisible();
  await expect(privacySwitch(page)).toBeDisabled();
  await expect(privacyControl(page)).toContainText(
    "You must be a project administrator to change project privacy.",
  );

  await takeAdministration.click();
  await expect(
    page.getByText(
      `You cannot take administration of project ${fixtureIds.project}. It is unavailable or you do not have access. The displayed project has not changed.`,
    ),
  ).toBeVisible();
  // An authoritative rejection is feedback, never navigation or a change of scope.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await expect(page.getByRole("heading", { level: 2, name: "Acceptance Project" })).toBeVisible();
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(factRow(page, "Your access")).toContainText("No project role");

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure`);
  await takeAdministration.click();
  await expect(page.getByText("You now administer this project.")).toBeVisible();
  await expect(factRow(page, "Your access")).toContainText("Administrator");
  await expect(page.getByText("You already administer this project.")).toBeVisible();
  // Ordinary authority arrives with the membership the server granted, not with the realm role.
  await expect(page.getByText("You have read-only access to this project.")).toHaveCount(0);
  await expect(privacySwitch(page)).toBeEnabled();
});

test("Manage owns project privacy and every project role change", async ({ page }, testInfo) => {
  const subject = subjectFor(testInfo);
  const colleague = `${subject}-observer`;
  await login(page, managePath, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();

  // Privacy. The project's own state answers, and the change is stated where it was made.
  await expect(privacySwitch(page)).toBeChecked();
  await privacySwitch(page).click();
  await expect(privacyControl(page).getByText("This project is now public.")).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Public");
  await expect(page.getByText("Public", { exact: true }).first()).toBeVisible();

  await privacySwitch(page).click();
  await expect(privacyControl(page).getByText("This project is now private.")).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Private");

  // Each membership list is changed here and nowhere else.
  await addMember(page, "Administrators", colleague);
  await expect(
    members(page, "Administrators").getByText(
      `${colleague} is now an administrator of this project.`,
    ),
  ).toBeVisible();
  await expect(memberChip(page, "Administrators", colleague)).toBeVisible();

  await addMember(page, "Editors", colleague);
  await expect(
    members(page, "Editors").getByText(`${colleague} is now an editor of this project.`),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", colleague)).toBeVisible();

  await members(page, "Observers").getByLabel(`Remove ${colleague}`).click();
  await expect(
    members(page, "Observers").getByText(`${colleague} is no longer an observer of this project.`),
  ).toBeVisible();
  await expect(memberChip(page, "Observers", colleague)).toHaveCount(0);

  // The refreshed project is what is displayed, and the URL never moved.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await page.reload();
  await expect(memberChip(page, "Administrators", colleague)).toBeVisible();
  await expect(memberChip(page, "Editors", colleague)).toBeVisible();
  await expect(memberChip(page, "Observers", colleague)).toHaveCount(0);
  await expect(factRow(page, "Privacy")).toContainText("Private");
});

test("a typed member name is a command, and one that names nobody says so", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  // Someone the directory does not list, so the name can only have arrived by being typed.
  const newcomer = `${subject}-newcomer`;
  await login(page, managePath, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();

  await typeMember(page, "Editors", newcomer);
  await expect(
    members(page, "Editors").getByText(`${newcomer} is now an editor of this project.`),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", newcomer)).toBeVisible();

  // A name that spells no user is declined where it was typed rather than silently dropped.
  await typeMember(page, "Editors", "   ");
  await expect(
    members(page, "Editors").getByText("Enter a username to add as an editor."),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", newcomer)).toHaveCount(1);

  await page.reload();
  await expect(memberChip(page, "Editors", newcomer)).toBeVisible();
});

test("a sent privacy change states what it is applying until the server answers", async ({
  page,
}, testInfo) => {
  await login(page, managePath, testInfo);
  await expect(privacySwitch(page)).toBeChecked();

  const release = await holdPrivacyChange(page);
  await privacySwitch(page).click();
  // The control shows the privacy it is applying, so a sent change never reads as one that was
  // refused, and it cannot be sent twice while the first is unanswered.
  await expect(privacySwitch(page)).not.toBeChecked();
  await expect(privacySwitch(page)).toBeDisabled();
  await expect(factRow(page, "Privacy")).toContainText("Private");

  await release();
  await expect(privacyControl(page).getByText("This project is now public.")).toBeVisible();
  await expect(privacySwitch(page)).not.toBeChecked();
  await expect(privacySwitch(page)).toBeEnabled();
  await expect(factRow(page, "Privacy")).toContainText("Public");
});

test("a rejected project change is feedback alone, and restored access succeeds", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const colleague = `${subject}-observer`;
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure?status=403`,
  );
  await login(page, managePath, testInfo);
  await expect(privacySwitch(page)).toBeEnabled();

  await privacySwitch(page).click();
  await expect(
    privacyControl(page).getByText(
      `You cannot change the privacy of project ${fixtureIds.project}. It is unavailable or you do not have access. The displayed project has not changed.`,
    ),
  ).toBeVisible();
  // A refusal changes neither the displayed project, nor its organisation, nor the route.
  await expect(page).toHaveURL(`${acceptanceUrls.app}${managePath}`);
  await expect(page.getByText("Acceptance Unit · Acceptance Organisation")).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Private");
  await expect(privacySwitch(page)).toBeChecked();

  await addMember(page, "Editors", colleague);
  await expect(
    members(page, "Editors").getByText(
      `You cannot change the editors of project ${fixtureIds.project}. It is unavailable or you do not have access. The displayed project has not changed.`,
    ),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", colleague)).toHaveCount(0);

  // Restored access needs no reload: the same control is still the next step.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure`);
  await addMember(page, "Editors", colleague);
  await expect(
    members(page, "Editors").getByText(`${colleague} is now an editor of this project.`),
  ).toBeVisible();
  await expect(memberChip(page, "Editors", colleague)).toBeVisible();
});

test("unconfirmed project facts leave changes available and defer to the server", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/caller-account-failure`);
  await login(page, managePath, testInfo);
  await expect(page.getByRole("heading", { level: 1, name: "Manage" })).toBeVisible();

  // Facts that cannot establish the caller never claim authority, and never claim its absence.
  await expect(factRow(page, "Your access")).toContainText("No project role");
  await expect(page.getByText("You have read-only access to this project.")).toHaveCount(0);
  await expect(privacySwitch(page)).toBeEnabled();
  await expect(privacyControl(page)).toContainText(
    "You must be a project administrator to change project privacy. Your permission will be confirmed when you use this action.",
  );

  // A transport failure states that nothing changed and leaves the control usable.
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure?status=503`,
  );
  await privacySwitch(page).click();
  await expect(
    privacyControl(page).getByText(
      `Could not change the privacy of project ${fixtureIds.project}. The displayed project has not changed; retry is available.`,
    ),
  ).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Private");
  await expect(privacySwitch(page)).toBeChecked();

  // Once the caller and the server both answer, the same control completes the change.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/project-mutation-failure`);
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/caller-account-failure`);
  await page.reload();
  await expect(factRow(page, "Your access")).toContainText("Administrator, Creator, Editor");
  await privacySwitch(page).click();
  await expect(privacyControl(page).getByText("This project is now public.")).toBeVisible();
  await expect(factRow(page, "Privacy")).toContainText("Public");
});

const onboardingPanel = (page: Page) =>
  page.getByRole("heading", { name: "Start working in a project of your own" });

/**
 * Work as the default organisation, the way a caller does: through the switcher. Changing
 * organisation leaves the current resource for Home, so Projects is opened again afterwards.
 */
const workAsDefaultOrganisation = async (page: Page) => {
  await page.getByLabel("Change organisation").click();
  await page.getByRole("menuitem", { name: /Default Organisation/u }).click();
  await expect(page.getByLabel("Change organisation")).toContainText("Default Organisation");
  await page.goto("projects");
};

test("a caller with nothing is onboarded into a project of their own and finds it listed", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.put(`${acceptanceUrls.control}/scenario/${subject}?profile=onboarding`);
  await login(page, "projects", testInfo);

  await expect(onboardingPanel(page)).toBeVisible();
  await expect(
    page.getByText("No projects are available in the current organisation."),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Create personal unit" }).click();
  await expect(
    page.getByText(`You already have a personal unit, ${subject}, and your project can go in it.`),
  ).toBeVisible();

  await page.getByRole("link", { name: "Create project" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/new?unit=${fixtureIds.personalUnit}`);
  // The handoff names the unit the panel meant, so nothing has to be chosen again here.
  await expect(page.getByRole("combobox", { name: "Containing unit" })).toHaveText(
    `Default Organisation / ${subject}`,
  );

  await page.getByLabel("Project name").fill("My First Project");
  await page.getByLabel("Tier").click();
  await page.getByRole("option", { name: "Bronze" }).click();
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.createdProject}/files`);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();

  // The point of this journey. A caller whose only unit is personal has the default organisation in
  // effect, so the screen they onboarded through lists the project they just made instead of
  // claiming they have none.
  await page.goto("projects");
  await expect(page.getByLabel("Change organisation")).toContainText("Default Organisation");
  await expect(page.getByText("My First Project", { exact: true })).toBeVisible();
  await expect(onboardingPanel(page)).toHaveCount(0);
});

test("a slow organisation index still decides which organisation the caller works as", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  // The default organisation answers from its own endpoint, so it can arrive first. Nothing may be
  // offered until the caller's own index has answered: the switcher adopts the first organisation
  // it is given, and a member of a real organisation who was handed the default one first would be
  // left working in their personal organisation, with their own projects filtered out of the index.
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/organisations-delay?milliseconds=1500`,
  );
  await login(page, "projects", testInfo);

  await expect(page.getByLabel("Change organisation")).toContainText("Acceptance Organisation");
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
});

test("a caller who already has a personal unit is told so rather than offered another", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, "projects", testInfo);
  // The offer is made in the organisation it would create in, so it is not on the index of the
  // organisation this caller works in by default.
  await expect(onboardingPanel(page)).toHaveCount(0);
  await workAsDefaultOrganisation(page);

  // The offer stands — this caller has no project in their own unit — and its first step reports the
  // unit they already have by name rather than silently not being there. That is the state a caller
  // who deleted the project in their personal unit comes back to.
  await expect(onboardingPanel(page)).toBeVisible();
  await expect(
    page.getByText(`You already have a personal unit, ${subject}, and your project can go in it.`),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Create personal unit" })).toHaveCount(0);
  await expect(page.getByText("Create your first project")).toBeVisible();
});

test("an editor in someone else's unit is offered a unit of their own and may put it away", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.put(`${acceptanceUrls.control}/scenario/${subject}?profile=no-personal-unit`);
  await login(page, "projects", testInfo);
  // Their collaborator's organisation is the one they work as, and the offer is not made there.
  await expect(onboardingPanel(page)).toHaveCount(0);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  await workAsDefaultOrganisation(page);
  await expect(onboardingPanel(page)).toBeVisible();

  // The panel reads the personal unit through the index rather than subscribing to it again. A
  // second subscription refetches on mount, which unsettles the very read the panel's visibility
  // depends on, and the offer then fetches the caller's personal unit for as long as it is on
  // screen. Counting the reads is the only thing that notices.
  await page.waitForTimeout(1000);
  const personalUnitReads = await request
    .get(`${acceptanceUrls.control}/scenario/${subject}`)
    .then((response) => response.json() as Promise<{ requests: { path: string }[] }>)
    .then(({ requests }) => requests.filter(({ path }) => path === "/personal-unit").length);
  expect(personalUnitReads).toBeLessThan(5);

  await page.getByRole("button", { name: "Not now" }).click();
  await expect(onboardingPanel(page)).toHaveCount(0);

  await page.reload();
  await expect(onboardingPanel(page)).toHaveCount(0);
  // The dismissal took the offer, not the workspace: the projects they collaborate in are still
  // exactly where they left them.
  await page.getByLabel("Change organisation").click();
  await page.getByRole("menuitem", { name: /Acceptance Organisation/u }).click();
  await page.goto("projects");
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
});

test("the index offers a unit beside Create project, and project creation can then use it", async ({
  page,
}, testInfo) => {
  await login(page, "projects", testInfo);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByLabel("Change organisation")).toContainText("Acceptance Organisation");

  await page.getByRole("button", { name: "Create unit" }).click();
  const dialog = page.getByRole("dialog");
  // A name this organisation already holds is refused here rather than by the Account Server.
  await dialog.getByLabel("Unit name").fill("Acceptance Unit");
  await expect(dialog.getByText("The name is already used for a unit")).toBeVisible();
  await expect(dialog.getByRole("button", { exact: true, name: "Create" })).toBeDisabled();

  await dialog.getByLabel("Unit name").fill("Bench Unit");
  await dialog.getByRole("button", { exact: true, name: "Create" }).click();

  // The unit is announced by name, and the caller is left exactly where they were reading.
  await expect(page.getByText("Unit Bench Unit created")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  // The point of the journey: the two steps join up without a reload.
  await page.getByRole("link", { name: "Create project" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/new`);
  await page.getByRole("combobox", { name: "Containing unit" }).click();
  await expect(
    page.getByRole("option", { name: "Acceptance Organisation / Bench Unit" }),
  ).toBeVisible();
});

test("the default organisation offers the personal unit, once, and then says it is taken", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.put(`${acceptanceUrls.control}/scenario/${subject}?profile=no-personal-unit`);
  await login(page, "projects", testInfo);
  // The offer speaks for the organisation in the header, so it is the named organisation's here.
  await expect(page.getByRole("button", { name: "Create unit" })).toBeVisible();

  await workAsDefaultOrganisation(page);
  await expect(onboardingPanel(page)).toBeVisible();
  // While the panel is up it owns the step: one screen does not ask the same thing twice.
  await expect(page.getByRole("button", { name: "Create personal unit" })).toHaveCount(1);

  // Dismissing the panel takes away the explanation, not the action.
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(onboardingPanel(page)).toHaveCount(0);
  const offer = page.getByRole("button", { name: "Create personal unit" });
  await expect(offer).toBeEnabled();
  await offer.click();

  await expect(page.getByText(`Personal unit ${subject} created`)).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects`);
  // The screen agrees with what the caller just did rather than offering a second one.
  await expect(page.getByRole("button", { name: "Create personal unit" })).toBeDisabled();
  await expect(page.getByText("You already have a personal unit.")).toBeVisible();
});

test("a caller who belongs to none of the organisation is refused the unit with its reason", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, "projects", testInfo);

  await expect(page.getByRole("button", { name: "Create unit" })).toBeDisabled();
  await expect(
    page.getByText("You must be a member or the owner of this organisation."),
  ).toBeVisible();
  // The refusal sits beside the index's main job rather than replacing it.
  await expect(page.getByRole("link", { name: "Create project" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
});
