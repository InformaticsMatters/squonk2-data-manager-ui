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

const observeProjectIdentityMismatch = async (page: Page, storageKey: string) => {
  await page.evaluate((key) => {
    sessionStorage.removeItem(key);
    const observer = new MutationObserver(() => {
      const filesHeading = [...document.querySelectorAll("h1, h2")].some(
        (heading) => heading.textContent === "Files",
      );
      const partnerIdentity = [...document.querySelectorAll("button")].some((button) =>
        button.textContent.includes("Partner Organisation"),
      );
      if (filesHeading && partnerIdentity) {
        sessionStorage.setItem(key, "true");
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }, storageKey);
};

/**
 * Watches the chrome for the whole of a navigation rather than only after it.
 *
 * The defect this guards against was a chrome that was thrown away and rebuilt, which an assertion
 * about the destination cannot see: by the time the destination has rendered, a rebuilt chrome and
 * a retained one look identical. Every mutation to the document is inspected instead, so a node
 * that leaves the document at any point during the navigation is recorded even if an identical one
 * takes its place.
 */
const watchChrome = async (page: Page, storageKey: string, includeProjectNavigation = false) => {
  // Watch a settled chrome, or the first sample records a node that had not arrived yet rather than
  // one that left. Everything here is authenticated, so the authenticated masthead is the settled
  // one; the sidebar is rendered hidden and arrives at its own priority.
  const workspaces = page.getByRole("navigation", { name: "Main" }).first();
  await expect(workspaces).toContainText("Administration");
  await expect(page.locator("header")).toBeAttached();
  await expect(page.locator("footer")).toBeAttached();
  await expect(page.locator("aside")).toBeAttached();
  if (includeProjectNavigation) {
    await expect(page.getByRole("navigation", { name: "Project" })).toBeAttached();
  }

  await page.evaluate(
    ([key, withProject]) => {
      const nodes: Record<string, Element | null> = {
        banner: document.querySelector("header"),
        eventStreamSidebar: document.querySelector("aside"),
        footer: document.querySelector("footer"),
        workspaceNavigation: document.querySelector('nav[aria-label="Main"]'),
        ...(withProject
          ? { sectionNavigation: document.querySelector('nav[aria-label="Project"]') }
          : {}),
      };
      const absent = Object.entries(nodes)
        .filter(([, node]) => !node)
        .map(([name]) => name);
      if (absent.length > 0) {
        throw new Error(`Chrome not present to watch: ${absent.join(", ")}`);
      }
      const record = () => {
        const detached = Object.entries(nodes)
          .filter(([, node]) => !node?.isConnected)
          .map(([name]) => name);
        const seen = new Set<string>([
          ...(JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[]),
          ...detached,
        ]);
        sessionStorage.setItem(key, JSON.stringify([...seen]));
      };
      record();
      new MutationObserver(record).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    },
    [storageKey, includeProjectNavigation] as const,
  );
};

const chromeRemovals = (page: Page, storageKey: string) =>
  page.evaluate((key) => sessionStorage.getItem(key), storageKey);

test("public Home and Documentation retain public navigation", async ({ page }) => {
  await page.goto(".");
  const mainNavigation = page.getByRole("navigation", { name: "Main" });
  await expect(mainNavigation).toContainText("Documentation");
  await expect(page.getByRole("link", { name: "Squonk Home" })).toHaveAttribute(
    "href",
    "/data-manager-ui",
  );
  // Scoped to the masthead: Home also lists the documentation tree, so an unscoped name would
  // match the developer guide's own entry in that list as well.
  await mainNavigation.getByRole("link", { name: "Documentation" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}docs`);
  await expect(mainNavigation).not.toContainText("Configuration");
});

test("protected login returns to the exact canonical route and allowed query", async ({
  page,
}, testInfo) => {
  const canonical = `projects/${fixtureIds.project}/results?search=kinase&type=task&type=instance`;

  await login(page, `${canonical}&unknown=discarded`, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${canonical}`);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();

  // Both the documentation index and a page beneath it, because the shell recognises the family by
  // a check that a `/docs/`-with-slash test would fail at the index exactly.
  for (const documentation of ["docs", "docs/concepts"]) {
    await page.goto(`${acceptanceUrls.app}${documentation}`);
    await expect(page.getByRole("navigation", { name: "Main" })).toContainText("Documentation");
    await expect(page.getByRole("navigation", { name: "Main" })).not.toContainText(
      "Administration",
    );
  }
});

test("Home exits project scope and browser history restores the canonical project", async ({
  page,
}, testInfo) => {
  const projectPath = `projects/${fixtureIds.project}/files?path=%2Finputs`;
  await login(page, projectPath, testInfo);

  // The section navigation is present from the moment the URL is read, so the project itself has to
  // be waited for: leaving before it resolves leaves before it is recorded as recently visited.
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
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
  // The chrome is mounted for every page, so this page has it too. Undiscoverable means the
  // navigation never offers it, not that the page is missing a way back out of it.
  await expect(page.getByRole("navigation", { name: "Main" })).not.toContainText("Configuration");
  await expect(page.getByRole("link", { name: "Squonk Home" })).toBeVisible();
});

test("organisation change reaches Home before persisting the new identity", async ({
  page,
}, testInfo) => {
  // The masthead is not rebuilt by the navigation any more, so the organisation menu closes by its
  // own transition. Identity is read from the masthead control rather than from the page at large,
  // which is what the assertion was always about.
  const mastheadIdentity = page.getByRole("button", { name: "Change organisation" });
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);
  await expect(mastheadIdentity).toContainText("Acceptance Organisation");
  // The masthead now renders before the project does, so the project has to be waited for: leaving
  // before it resolves leaves before it is recorded as recently visited.
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Change organisation" }).click();
  await observeProjectIdentityMismatch(page, "organisation-project-mismatch");
  await page.getByRole("option", { name: /Partner Organisation/u }).click();

  await expect(page).toHaveURL(homeUrl);
  await expect(mastheadIdentity).toContainText("Partner Organisation");
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
  await expect(mastheadIdentity).toContainText("Partner Organisation");

  await observeProjectIdentityMismatch(page, "organisation-project-adoption-mismatch");
  await page.getByRole("link", { name: "Open files" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/files`);
  await expect(mastheadIdentity).toContainText("Acceptance Organisation");
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("organisation-project-adoption-mismatch")),
    )
    .toBeNull();
});

test("the organisation switcher answers the same keys as the project selector", async ({
  page,
}, testInfo) => {
  const mastheadIdentity = page.getByRole("button", { name: "Change organisation" });
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);
  await expect(mastheadIdentity).toContainText("Acceptance Organisation");
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  await mastheadIdentity.click();
  const search = page.getByRole("combobox", { name: "Search organisations" });
  // The same control as the project selector directly beneath: focus lands in the search box as
  // the menu opens, and what choosing a row will do is stated rather than discovered.
  await expect(search).toBeFocused();
  await expect(page.getByText("Opens Home")).toBeVisible();

  const options = page.getByRole("option");
  await expect(options).toHaveCount(3);
  // The identifier beneath the name, so two similarly-named organisations can be told apart.
  await expect(options.filter({ hasText: "Acceptance Organisation" })).toContainText(
    fixtureIds.organisation,
  );
  // Where the caller already is; the highlight is where the keyboard is, and starts at the top.
  await expect(page.getByRole("option", { name: /Acceptance Organisation/u })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(options.first()).toHaveAttribute("aria-selected", "true");

  // Typing narrows by name, and the highlight returns to the top of what the list has become.
  await search.fill("partner");
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await search.press("Enter");

  // Home is reached before the new identity is shown, exactly as the pointer journey requires.
  await expect(page).toHaveURL(homeUrl);
  await expect(mastheadIdentity).toContainText("Partner Organisation");
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), APPLICATION_ORGANISATION_STORAGE_KEY),
    )
    .toContain(fixtureIds.otherOrganisation);

  // Reopening starts clean, and choosing the organisation already in effect does nothing at all.
  await mastheadIdentity.click();
  await expect(search).toHaveValue("");
  await page.getByRole("option", { name: /Partner Organisation/u }).click();
  await expect(page).toHaveURL(homeUrl);
  await expect(mastheadIdentity).toContainText("Partner Organisation");

  // A control with nowhere to link to offers nothing a modifier could do differently, so a
  // modifier click is answered as an ordinary one rather than appearing to promise a new tab.
  await mastheadIdentity.click();
  await page
    .getByRole("option", { name: /Acceptance Organisation/u })
    .click({ modifiers: ["ControlOrMeta"] });
  await expect(page).toHaveURL(homeUrl);
  await expect(mastheadIdentity).toContainText("Acceptance Organisation");

  // A search matching nothing names what did not match, and Escape hands the keyboard back.
  await mastheadIdentity.click();
  await search.fill("no such organisation");
  await expect(page.getByText("No organisation matches “no such organisation”.")).toBeVisible();
  await search.press("Escape");
  await expect(search).toHaveCount(0);
  await expect(mastheadIdentity).toBeFocused();
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

test("the chrome is never removed by a workspace change", async ({ page }, testInfo) => {
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await page.getByLabel("Account").getByRole("button").click();
  await page.getByRole("button", { name: /Show event stream/u }).click();
  await expect(page.getByRole("heading", { name: "Event Stream" })).toBeVisible();

  await watchChrome(page, "workspace-change-chrome");

  const workspaces = page.getByRole("navigation", { name: "Main" });
  await workspaces.getByRole("link", { name: "Datasets" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets`);
  await expect(page.getByRole("heading", { name: "Datasets" })).toBeVisible();

  await workspaces.getByRole("link", { name: "Administration" }).click();
  await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();

  await workspaces.getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  expect(await chromeRemovals(page, "workspace-change-chrome")).toBe("[]");
  // The sidebar the caller opened is still open, with what it was showing, three workspaces later.
  await expect(page.getByRole("heading", { name: "Event Stream" })).toBeVisible();
  await expect(page.getByText("Event stream (not available)")).toBeVisible();
});

test("the chrome survives crossing between a public page and a workspace", async ({
  page,
}, testInfo) => {
  await login(page, "projects", testInfo);
  await page.getByRole("link", { name: "Squonk Home" }).click();
  await expect(page).toHaveURL(homeUrl);

  await watchChrome(page, "policy-change-chrome");

  // Home is a public page and Project is a family one. They are different compositions, and the
  // caller is entitled to notice nothing at all when crossing between them.
  const workspaces = page.getByRole("navigation", { name: "Main" });
  await workspaces.getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  await page.getByRole("link", { name: "Squonk Home" }).click();
  await expect(page).toHaveURL(homeUrl);
  await expect(workspaces).toBeVisible();

  expect(await chromeRemovals(page, "policy-change-chrome")).toBe("[]");
});

test("a section change changes only the content region", async ({ page }, testInfo) => {
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  await watchChrome(page, "section-change-chrome", true);

  for (const [section, heading] of [
    ["Run", "Run"],
    ["Results", "Results"],
    ["Manage", "Manage"],
    ["Files", "Files"],
  ] as const) {
    // The section navigation is under the caller's cursor throughout, so a wrong section is one
    // click to correct rather than a wait for the application to come back.
    await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
    await page
      .getByRole("navigation", { name: "Project" })
      .getByRole("link", { name: section, exact: true })
      .click();
    await expect(page.getByRole("heading", { exact: true, name: heading })).toBeVisible();
  }

  expect(await chromeRemovals(page, "section-change-chrome")).toBe("[]");
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
});

test("the identity strip shows a placeholder while the project resolves", async ({
  page,
}, testInfo) => {
  await login(page, "projects", testInfo);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  // Hold the project read open so the window between the route arriving and the project arriving is
  // long enough to observe. It is a real window, not one this test invents.
  await page.route(`${acceptanceUrls.dataManager}/project/${fixtureIds.project}`, async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
    await route.continue();
  });

  await page.goto(`${acceptanceUrls.app}projects/${fixtureIds.project}/files`);

  await expect(page.getByRole("status", { name: "Loading project" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();
  await expect(page.getByText("Project unavailable")).toHaveCount(0);

  // A slow read does not lock the caller into the page: the selector opens over the placeholder.
  await page.getByRole("button", { name: "Change project" }).click();
  await expect(page.getByRole("combobox", { name: "Search projects" })).toBeFocused();
  await page.getByRole("combobox", { name: "Search projects" }).press("Escape");

  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("status", { name: "Loading project" })).toHaveCount(0);
});

test("the identity strip states an unavailable project only when it failed", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);
  await expect(page.getByText("Acceptance Project", { exact: true })).toBeVisible();

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/project-failure?status=403`);
  await page.reload();

  await expect(page.getByText("Project unavailable")).toBeVisible();
  await expect(page.getByRole("status", { name: "Loading project" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Project" })).toBeVisible();

  // The selector still opens, because it is the way out of a project that cannot be shown.
  await page.getByRole("button", { name: "Change project" }).click();
  await expect(page.getByRole("combobox", { name: "Search projects" })).toBeFocused();
  await expect(page.getByRole("option", { name: /Screening Project/u })).toBeVisible();
});

test("a route the application cannot address keeps the chrome", async ({ page }, testInfo) => {
  await login(page, "projects", testInfo);
  await page.goto(`${acceptanceUrls.app}projects/not-a-project/files`);

  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  // A not-found page with nowhere to go is worse than one inside the navigation the caller used.
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Squonk Home" })).toBeVisible();

  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Datasets" })
    .click();
  await expect(page.getByRole("heading", { name: "Datasets" })).toBeVisible();
});

test("a malformed protected route is refused without a sign-in round trip", async ({ page }) => {
  await page.goto(`${acceptanceUrls.app}projects/not-a-project/files`);

  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/not-a-project/files`);
});

test("the project selector is driven from the keyboard and keeps the section it opened from", async ({
  page,
}, testInfo) => {
  await login(page, `projects/${fixtureIds.project}/results`, testInfo);
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  const identity = page.getByRole("button", { name: "Change project" });
  await expect(identity).toContainText("Acceptance Project");

  await identity.click();
  const search = page.getByRole("combobox", { name: "Search projects" });
  // Focus lands in the search box as the menu opens, so the keyboard is live without a click into
  // it first. Nothing about which section will open is left to be discovered.
  await expect(search).toBeFocused();
  await expect(page.getByText("Opens Results")).toBeVisible();
  await expect(page.getByText("All projects (5)")).toBeVisible();

  const options = page.getByRole("option");
  await expect(options).toHaveCount(5);
  // The list holds the organisation in effect, so a project of the caller's own in another one is
  // not offered here even though they can reach it.
  await expect(page.getByRole("option", { name: /Partner Project/u })).toHaveCount(0);
  // The check says where the caller is; the highlight says where the keyboard is. Both start on
  // the same row here only because the list is ordered by name.
  await expect(options.first()).toHaveAttribute("aria-current", "true");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");

  await search.press("ArrowUp");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");
  await search.press("End");
  await expect(options.last()).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowDown");
  await expect(options.last()).toHaveAttribute("aria-selected", "true");
  await search.press("Home");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");

  await search.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  // Focus never leaves the search box — which is what lets typing and arrowing interleave — so the
  // highlight is carried to assistive technology by active-descendant instead.
  await expect(search).toBeFocused();
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    (await options.nth(1).getAttribute("id")) ?? "",
  );

  await search.press("Enter");

  // Results, in the project chosen, at that project's own canonical route.
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}projects/${fixtureIds.screeningProject}/results`,
  );
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(identity).toContainText("Screening Project");

  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/results`);
  await expect(identity).toContainText("Acceptance Project");
});

test("the project selector searches by project, containing unit and organisation", async ({
  page,
}, testInfo) => {
  await login(page, `projects/${fixtureIds.project}/files`, testInfo);
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  const identity = page.getByRole("button", { name: "Change project" });
  await expect(identity).toContainText("Acceptance Project");

  await identity.click();
  const search = page.getByRole("combobox", { name: "Search projects" });
  await expect(search).toBeFocused();
  await expect(page.getByText("Opens Files")).toBeVisible();

  // The containing unit narrows the list although no project is named for it.
  await search.fill("screening unit");
  await expect(page.getByText("2 of 5 projects")).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(2);

  // The count is of the list the caller is being offered rather than of every project they can
  // reach: one in another organisation is outside the scope, and outside the total with it.
  await search.fill("project");
  await expect(page.getByText("5 of 5 projects")).toBeVisible();
  await expect(page.getByRole("option", { name: /Partner Project/u })).toHaveCount(0);

  await search.fill("no such project");
  await expect(page.getByText("No project matches “no such project”.")).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(0);

  // Escape backs out without choosing and hands the keyboard back to the identity it opened from.
  await search.press("Escape");
  await expect(search).toHaveCount(0);
  await expect(identity).toBeFocused();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/files`);

  // Tab leaves too, rather than turning every project into a tab stop on the way out.
  await identity.click();
  await expect(page.getByRole("combobox", { name: "Search projects" })).toBeFocused();
  await page.getByRole("combobox", { name: "Search projects" }).press("Tab");
  await expect(page.getByRole("combobox", { name: "Search projects" })).toHaveCount(0);
  await expect(identity).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(identity).not.toBeFocused();

  // The search text described no page and could be sent to nobody, so it is gone.
  await identity.click();
  await expect(page.getByRole("combobox", { name: "Search projects" })).toHaveValue("");
  await expect(page.getByText("All projects (5)")).toBeVisible();

  // Every row is a real link, so a modifier click opens the project elsewhere and leaves this one
  // where it was — with the menu still open, because the caller may well want another.
  const opened = page.context().waitForEvent("page");
  await page
    .getByRole("option", { name: /Screening Project/u })
    .click({ modifiers: ["ControlOrMeta"] });
  await (await opened).close();
  await expect(page.getByRole("combobox", { name: "Search projects" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/files`);
});
