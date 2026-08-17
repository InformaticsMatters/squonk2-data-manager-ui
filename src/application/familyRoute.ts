import { type AdministrationRoute, parseAdministrationRoute } from "../administration/routes";
import { type DatasetRoute, parseDatasetRoute } from "../datasets/routes";
import { parseProjectRoute, type ProjectRoute } from "../projects/routes";
import { type RouteNotFoundParent, type RouteParseResult } from "../routing/routeContract";
import {
  type AdministrationSection,
  type DatasetSection,
  type PagePolicy,
  type ProjectSection,
} from "./pagePolicy";

export type FamilyPagePolicy = Exclude<PagePolicy, { kind: "application" | "public" }>;
export type FamilyRoute = AdministrationRoute | DatasetRoute | ProjectRoute;

export type FamilyRouteDecision =
  /** A child the family cannot address beneath a parent the family still owns. */
  | { kind: "local-not-found"; parent: RouteNotFoundParent }
  | { kind: "not-found" }
  | { kind: "pending" }
  | { kind: "ready"; route: FamilyRoute }
  | { kind: "replace"; canonicalHref: string };

const projectSections = {
  create: "create",
  deletion: "deletion",
  "file-view": "files",
  files: "files",
  index: "index",
  manage: "manage",
  result: "results",
  results: "results",
  run: "run",
  "run-definition": "run",
} as const satisfies Record<ProjectRoute["kind"], ProjectSection>;

const datasetSections = {
  dataset: "detail",
  index: "list",
  version: "detail",
  viewer: "viewer",
} as const satisfies Record<DatasetRoute["kind"], DatasetSection>;

const administrationSections = {
  "charge-resource": "charges",
  charges: "charges",
  "organisation-access": "organisation-access",
  "organisation-access-resource": "organisation-access",
  subscription: "subscriptions",
  subscriptions: "subscriptions",
  "usage-inventory": "usage-inventory",
  "usage-inventory-resource": "usage-inventory",
} as const satisfies Record<AdministrationRoute["kind"], AdministrationSection>;

/**
 * A parse failure that named a parent this very section owns is that section's own child failure.
 * The section therefore keeps its frame — and, in Projects, the project the parent names — instead
 * of the whole route disappearing, which is what distinguishes a missing child from a missing
 * parent. Anything else is an ordinary not-found.
 */
const decideParsedRoute = <TRoute extends FamilyRoute>(
  parsed: RouteParseResult<TRoute>,
  policy: FamilyPagePolicy,
  sectionMatches: (route: TRoute) => boolean,
): FamilyRouteDecision => {
  if (parsed.kind === "not-found") {
    const { parent } = parsed;
    return parent?.family === policy.kind && parent.section === policy.section
      ? { kind: "local-not-found", parent }
      : { kind: "not-found" };
  }
  if (!sectionMatches(parsed.route)) {
    return { kind: "not-found" };
  }
  if (parsed.needsReplace) {
    return { kind: "replace", canonicalHref: parsed.canonicalHref };
  }
  return { kind: "ready", route: parsed.route };
};

/**
 * What a family brings to route resolution: its own parser, and the section each of its route kinds
 * belongs to. Everything a family does with those two facts is the same, so it is written once here
 * and each family supplies only the pair.
 */
const familyRouteContract =
  <TRoute extends FamilyRoute>(
    parse: (href: string) => RouteParseResult<TRoute>,
    /** Exhaustive over the family's own route kinds where it is declared, read by kind here. */
    sections: Readonly<Record<string, FamilyPagePolicy["section"]>>,
  ) =>
  (policy: FamilyPagePolicy, href: string): FamilyRouteDecision =>
    decideParsedRoute(parse(href), policy, (route) => sections[route.kind] === policy.section);

const familyRouteContracts: Record<
  FamilyPagePolicy["kind"],
  (policy: FamilyPagePolicy, href: string) => FamilyRouteDecision
> = {
  administration: familyRouteContract(parseAdministrationRoute, administrationSections),
  datasets: familyRouteContract(parseDatasetRoute, datasetSections),
  projects: familyRouteContract(parseProjectRoute, projectSections),
};

export const resolveFamilyRoute = (
  policy: FamilyPagePolicy,
  href: string,
  routerReady: boolean,
): FamilyRouteDecision =>
  routerReady ? familyRouteContracts[policy.kind](policy, href) : { kind: "pending" };
