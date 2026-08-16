import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseAdministrationRoute } from "../../src/administration/routes";
import { LEGACY_SCOPE_STORAGE_KEYS } from "../../src/application/applicationIdentity";
import { parseDatasetRoute } from "../../src/datasets/routes";
import { parseProjectRoute } from "../../src/projects/routes";
import { removedRoutePaths } from "../removedRoutes";

const root = path.join(process.cwd(), "src");
const typescriptSource = /\.(?:mdx|tsx?)$/u;
const generated = /(?:^|\/)generated\//u;

/**
 * Every module this repository writes by hand. The generated client trees are excluded because
 * they are replaced wholesale by Orval and are not this cutover's to police.
 */
const handwrittenSources = () =>
  readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    )
    .filter((file) => !generated.test(file) && !file.startsWith("api/"))
    .toSorted();

const sourcesMatching = (pattern: RegExp) =>
  handwrittenSources().filter((file) => pattern.test(readFileSync(path.join(root, file), "utf8")));

/** The same set the production-build journey walks, addressed as the family parsers see it. */
const removedRoutes = removedRoutePaths({
  dataset: "dataset-00000000-0000-4000-8000-000000000001",
  instance: "instance-00000000-0000-4000-8000-000000000006",
  organisation: "org-00000000-0000-4000-8000-000000000004",
  product: "product-00000000-0000-4000-8000-000000000005",
  project: "project-00000000-0000-4000-8000-000000000002",
  task: "task-00000000-0000-4000-8000-000000000007",
  unit: "unit-00000000-0000-4000-8000-000000000003",
  workflow: "r-workflow-00000000-0000-4000-8000-000000000008",
}).map((route) => `/${route}`);

test.describe("removed routes", () => {
  test("no removed route survives as a page entry", () => {
    for (const removed of [
      "src/pages/project.tsx",
      "src/pages/project",
      "src/pages/run.tsx",
      "src/pages/results.tsx",
      "src/pages/results",
      "src/pages/dataset",
      "src/pages/products.tsx",
      "src/pages/product",
      "src/pages/unit",
      "src/pages/organisation",
      "src/pages/viewer",
    ]) {
      expect(existsSync(path.join(process.cwd(), removed)), removed).toBe(false);
    }
  });

  test("every removed route is an ordinary not-found in all three families", () => {
    for (const href of removedRoutes) {
      expect(parseProjectRoute(href), href).toEqual({ kind: "not-found" });
      expect(parseDatasetRoute(href), href).toEqual({ kind: "not-found" });
      expect(parseAdministrationRoute(href), href).toEqual({ kind: "not-found" });
    }
  });

  test("the page entries the cutover keeps are still there", () => {
    // Removing eleven page entries is only safe evidence beside the ones that had to survive it:
    // public Home, Documentation, the internal configuration route, and all three landing routes.
    for (const retained of [
      "src/pages/index.tsx",
      "src/pages/configuration.tsx",
      "src/pages/docs/concepts.tsx",
      "src/pages/datasets.tsx",
      "src/pages/projects/index.tsx",
      "src/pages/administration/index.tsx",
    ]) {
      expect(existsSync(path.join(process.cwd(), retained)), retained).toBe(true);
    }
  });

  test("the build configuration answers for no removed route", () => {
    // A redirect, rewrite, or alias declared here would answer a removed URL before any parser
    // above ever saw it, which is exactly the migration behavior this cutover does without.
    // Both the property form (`redirects: () => …`) and the method shorthand Next also accepts
    // (`async redirects() { … }`), so neither spelling can slip a removed route back in.
    const configuration = readFileSync(path.join(process.cwd(), "next.config.mjs"), "utf8");
    expect(configuration).not.toMatch(/^\s*(?:async\s+)?(?:redirects|rewrites)\s*[:(]/mu);
  });

  test("no handwritten module composes a removed route", () => {
    // A removed path composed by hand, rather than built by a family's own link interface, would
    // be a second route owner that the parsers above could never see.
    expect(
      sourcesMatching(
        /pathname: ["'`]\/(?:project|run|results|products|viewer\/sdf)["'`]|href=["'`]\/(?:project|run|results|products)(?:[/?"'`])/u,
      ),
    ).toEqual([]);
  });
});

test.describe("removed scope ownership", () => {
  test("no selected project, unit, or product-synchronised scope store survives", () => {
    for (const removed of [
      "src/state/unitSelection.ts",
      "src/state/fileSelection.ts",
      "src/hooks/projectHooks.ts",
      "src/hooks/projectPathHooks.ts",
      "src/hooks/useSyncProject.ts",
      "src/hooks/useSyncUnitAndOrgFromProduct.ts",
      "src/components/app/TopLevelHooks.tsx",
      "src/components/userContext",
      "src/features/ProjectStats",
      "src/features/UserBootstrapper",
      "src/features/ProjectTable",
      "src/layouts/navigation/OUPContext.tsx",
    ]) {
      expect(existsSync(path.join(process.cwd(), removed)), removed).toBe(false);
    }
  });

  test("no handwritten module reads a selected project, unit, or current-project fallback", () => {
    expect(
      sourcesMatching(
        /useCurrentProject|useCurrentProjectId|useSelectedUnit|useSyncUnitAndOrgFromProduct|useSelectedFiles|OUPContext/u,
      ),
    ).toEqual([]);
  });

  test("organisation identity is the only selection state the application holds", () => {
    // A selection hook that resolves its resource through a generated query is identity; one that
    // holds the resource itself is the mutable global scope this cutover removed. This list is
    // closed: identity is read where it is displayed, adopted, cleared, and stored, nowhere else.
    expect(sourcesMatching(/useSelectedOrganisation/u)).toEqual([
      "components/workspaces/ProjectsIndex.tsx",
      "layouts/navigation/OrganisationIdentity.tsx",
      "projects/ProjectOrganisationBoundary.tsx",
      "state/organisationSelection.ts",
    ]);
  });

  test("no query state is copied from one route onto another", () => {
    // Spreading the router's query into a new href is how unrelated state used to follow a caller
    // between workspaces. Every family builds its own href from its own allowlist instead.
    expect(sourcesMatching(/\.\.\.\s*(?:router|useRouter\(\))\.query\b/u)).toEqual([]);
    // The scope the old routes carried in the query string is named by no handwritten module: a
    // project, unit, or organisation is a path segment now, never a value a link copies forward.
    expect(sourcesMatching(/query: \{[^}]*\b(?:project|unit|organisation):/u)).toEqual([]);
  });
});

test.describe("removed Settings ownership", () => {
  test("the Settings modal and the management entry points it owned no longer exist", () => {
    for (const removed of [
      "src/components/modals/SettingsModal",
      "src/components/userContext/SelectProject.tsx",
      "src/components/userContext/SelectUnit.tsx",
      "src/components/userContext/SelectOrganisation.tsx",
      "src/components/projects/CreateProject",
      "src/components/products/ProductsView",
    ]) {
      expect(existsSync(path.join(process.cwd(), removed)), removed).toBe(false);
    }
  });

  test("no handwritten module offers a Settings entry point", () => {
    expect(
      sourcesMatching(/SettingsModal|aria-label=["'`]Settings["'`]|CreateProjectForm/u),
    ).toEqual([]);
  });
});

test.describe("persisted domain identity", () => {
  test("current organisation is the only domain identity written to durable storage", () => {
    // Every writer, however it reaches the store. Most of these take an injected `Storage` and
    // call `storage.setItem`, so matching the global alone would let a new module persist scope
    // through a handle without this list ever noticing. What each one writes is named beside it:
    // a device preference, a direct-link history, or a record of work in flight — never a scope a
    // later visit could be resolved against.
    expect(sourcesMatching(/\bsetItem\(/u)).toEqual([
      // Whether this tab has already signed in again to recover an unusable session.
      "application/apiClientRecovery.ts",
      // The billing unit of the last successful upload.
      "datasets/uploadBilling.ts",
      // Records of a cross-service workflow this caller left in flight.
      "projects/projectCreation.ts",
      "projects/projectDeletion.ts",
      // Direct-link history for Home, which never becomes application scope.
      "projects/recentProjects.ts",
      // The one persisted domain identity.
      "state/organisationSelection.ts",
      // The shared device-preference writer.
      "utils/next/localStorage.ts",
    ]);
    // That shared writer can only be handed a device preference, so no scope can reach it by name:
    // its key union is closed over consent and debug mode alone.
    expect(readFileSync(path.join(root, "utils/next/localStorage.ts"), "utf8")).toMatch(
      /type Keys =\s*typeof COOKIE_CONSENT_STORAGE_KEY\s*\|\s*typeof EVENT_DEBUG_MODE_STORAGE_KEY;/u,
    );
    // Only the organisation reaches durable storage without an injected handle, and it is the only
    // key the application resolves a resource from on a later visit.
    expect(sourcesMatching(/(?:local|session)Storage\.setItem/u)).toEqual([
      "state/organisationSelection.ts",
      "utils/next/localStorage.ts",
    ]);
  });

  test("no handwritten module writes a legacy scope key", () => {
    for (const key of LEGACY_SCOPE_STORAGE_KEYS) {
      expect(sourcesMatching(new RegExp(String.raw`setItem\([^)]*${key}`, "u")), key).toEqual([]);
    }
    expect(
      sourcesMatching(/PROJECT_LOCAL_STORAGE_KEY|PROJECT_FILE_LOCAL_STORAGE_KEY|projectPayload/u),
    ).toEqual([]);
  });

  test("every legacy scope key the old application wrote is named for removal", () => {
    // Both keys the retired `writeToLocalStorage` map could reach are named here, so a returning
    // caller's stored project and file scope is deleted rather than merely ignored.
    expect([...LEGACY_SCOPE_STORAGE_KEYS]).toEqual([
      "data-manager-ui-current-project",
      "data-manager-ui-selected-files",
    ]);
  });
});
