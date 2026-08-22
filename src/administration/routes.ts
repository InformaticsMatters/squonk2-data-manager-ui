import { isProductId, isUnitId, type ProductId, type UnitId } from "../routing/identifiers";
import {
  assertRouteValue,
  buildHref,
  isSearch,
  localNotFoundRoute,
  notFoundRoute,
  parseRouteLocation,
  readOptionalQuery,
  type RouteParseResult,
  validRoute,
} from "../routing/routeContract";

/**
 * The Administration route table.
 *
 * The index is organisation-relative and the resources are absolute: `/administration` renders the
 * organisation in the masthead, while a unit or subscription URL identifies itself and means the
 * same thing to whoever opens it. That asymmetry is why no organisation identifier appears in any
 * path here — the organisation is ambient, and putting it in a URL would give the same page two
 * addresses.
 */

export type ChargeRouteState = { billingCycle: number };

/** What narrows the unit list in the rail. Only the overview owns it, because only it renders one. */
export type OverviewState = { search?: string };

export type AdministrationRoute =
  | { kind: "organisation-charges"; state: ChargeRouteState }
  | { kind: "organisation-usage" }
  | { kind: "subscription-charges"; productId: ProductId; state: ChargeRouteState; unitId: UnitId }
  /** Resolves to a subscription's canonical unit-scoped address; renders nothing of its own. */
  | { kind: "subscription-entry"; productId: ProductId }
  | { kind: "subscription"; productId: ProductId; unitId: UnitId }
  | { kind: "unit-access"; unitId: UnitId }
  | { kind: "unit-charges"; state: ChargeRouteState; unitId: UnitId }
  | { kind: "unit-subscriptions"; unitId: UnitId }
  | { kind: "unit-usage"; unitId: UnitId }
  | (OverviewState & { kind: "overview" });

/** The sections the family's pages are composed under, which are exactly its route kinds. */
export type AdministrationRouteKind = AdministrationRoute["kind"];

const isBillingCycle = (value: string): boolean => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= -23 && parsed <= 0 && String(parsed) === value;
};

const parseChargeState = (searchParams: URLSearchParams): ChargeRouteState => ({
  billingCycle: Number(readOptionalQuery(searchParams, "billing-cycle", isBillingCycle) ?? 0),
});

/**
 * The one way a billing cycle reaches a link. The current cycle is the ledger's own default rather
 * than a value the URL carries, so a link to it and a link that spells it out are the same link.
 */
const billingCycleQuery = (state: ChargeRouteState | undefined) => {
  const billingCycle = assertRouteValue(
    String(state?.billingCycle ?? 0),
    isBillingCycle,
    "billing cycle",
  );
  return [["billing-cycle", billingCycle === "0" ? undefined : billingCycle]] as const;
};

/** The one way the overview's search term reaches a link, so a malformed one is never written. */
const searchQuery = (search: string | undefined) =>
  [["search", search && isSearch(search) ? search : undefined]] as const;

const assertUnitId = (value: string) => assertRouteValue(value, isUnitId, "unit ID");
const assertProductId = (value: string) => assertRouteValue(value, isProductId, "product ID");

const unitPath = (unitId: string) => `/administration/units/${assertUnitId(unitId)}`;

const subscriptionPath = (unitId: string, productId: string) =>
  `${unitPath(unitId)}/subscriptions/${assertProductId(productId)}`;

export const administrationLinks = {
  overview: (state: OverviewState = {}) => buildHref("/administration", searchQuery(state.search)),
  organisationCharges: (state?: ChargeRouteState) =>
    buildHref("/administration/charges", billingCycleQuery(state)),
  organisationUsage: () => "/administration/usage",
  unitAccess: (unitId: string) => `${unitPath(unitId)}/access`,
  unitSubscriptions: (unitId: string) => `${unitPath(unitId)}/subscriptions`,
  unitCharges: (unitId: string, state?: ChargeRouteState) =>
    buildHref(`${unitPath(unitId)}/charges`, billingCycleQuery(state)),
  unitUsage: (unitId: string) => `${unitPath(unitId)}/usage`,
  subscription: (unitId: string, productId: string) => subscriptionPath(unitId, productId),
  subscriptionCharges: (unitId: string, productId: string, state?: ChargeRouteState) =>
    buildHref(`${subscriptionPath(unitId, productId)}/charges`, billingCycleQuery(state)),
  /**
   * The convenience entry for a caller holding only a product identifier. It resolves to the
   * canonical unit-scoped address rather than rendering, so it never becomes a second address for
   * the subscription page itself.
   */
  subscriptionEntry: (productId: string) =>
    `/administration/subscriptions/${assertProductId(productId)}`,
};

/**
 * Where the convenience entry sends a caller once the product has named its unit. Pure, so the
 * destination a resolving route replaces itself with is decided in one place and provable without a
 * browser.
 */
export const subscriptionEntryDestination = (unitId: string, productId: string) =>
  administrationLinks.subscription(unitId, productId);

/** The unit sections, in the order the unit's own tab strip offers them. */
export const unitSections = [
  { key: "unit-access", label: "Access" },
  { key: "unit-subscriptions", label: "Subscriptions" },
  { key: "unit-charges", label: "Charges" },
  { key: "unit-usage", label: "Usage & Inventory" },
] as const satisfies readonly { key: AdministrationRouteKind; label: string }[];

export type UnitSectionKey = (typeof unitSections)[number]["key"];

export const unitSectionHref = (section: UnitSectionKey, unitId: string): string => {
  switch (section) {
    case "unit-access":
      return administrationLinks.unitAccess(unitId);
    case "unit-subscriptions":
      return administrationLinks.unitSubscriptions(unitId);
    case "unit-charges":
      return administrationLinks.unitCharges(unitId);
    case "unit-usage":
      return administrationLinks.unitUsage(unitId);
  }
};

/** The sections one subscription has, in the order its own tab strip offers them. */
export const subscriptionSections = [
  { key: "subscription", label: "Subscription" },
  { key: "subscription-charges", label: "Charges" },
] as const satisfies readonly { key: AdministrationRouteKind; label: string }[];

export type SubscriptionSectionKey = (typeof subscriptionSections)[number]["key"];

export const subscriptionSectionHref = (
  section: SubscriptionSectionKey,
  unitId: string,
  productId: string,
): string =>
  section === "subscription"
    ? administrationLinks.subscription(unitId, productId)
    : administrationLinks.subscriptionCharges(unitId, productId);

const parsedUnitId = (value: string): UnitId | null => (isUnitId(value) ? value : null);
const parsedProductId = (value: string): ProductId | null => (isProductId(value) ? value : null);

/**
 * The unit tree. Every route beneath `/administration/units/{unitId}` is decided here, so the
 * section a malformed identifier fails inside is the section whose page was addressed rather than
 * whichever segment happened to be wrong.
 */
const parseUnitRoute = (
  location: ReturnType<typeof parseRouteLocation> & object,
): RouteParseResult<AdministrationRoute> => {
  const { searchParams, segments } = location;
  const unitId = parsedUnitId(segments[2]);

  if (segments.length === 3 || (segments.length === 4 && segments[3] === "access")) {
    if (!unitId) {
      return localNotFoundRoute("administration", "unit-access");
    }
    const route: AdministrationRoute = { kind: "unit-access", unitId };
    return validRoute(location, route, administrationLinks.unitAccess(unitId));
  }

  if (segments.length === 4 && segments[3] === "charges") {
    if (!unitId) {
      return localNotFoundRoute("administration", "unit-charges");
    }
    const state = parseChargeState(searchParams);
    const route: AdministrationRoute = { kind: "unit-charges", state, unitId };
    return validRoute(location, route, administrationLinks.unitCharges(unitId, state));
  }

  if (segments.length === 4 && segments[3] === "usage") {
    if (!unitId) {
      return localNotFoundRoute("administration", "unit-usage");
    }
    const route: AdministrationRoute = { kind: "unit-usage", unitId };
    return validRoute(location, route, administrationLinks.unitUsage(unitId));
  }

  if (segments.length === 4 && segments[3] === "subscriptions") {
    if (!unitId) {
      return localNotFoundRoute("administration", "unit-subscriptions");
    }
    const route: AdministrationRoute = { kind: "unit-subscriptions", unitId };
    return validRoute(location, route, administrationLinks.unitSubscriptions(unitId));
  }

  if (segments.length === 5 && segments[3] === "subscriptions") {
    const productId = parsedProductId(segments[4]);
    if (!unitId || !productId) {
      return localNotFoundRoute("administration", "subscription");
    }
    const route: AdministrationRoute = { kind: "subscription", productId, unitId };
    return validRoute(location, route, administrationLinks.subscription(unitId, productId));
  }

  if (segments.length === 6 && segments[3] === "subscriptions" && segments[5] === "charges") {
    const productId = parsedProductId(segments[4]);
    if (!unitId || !productId) {
      return localNotFoundRoute("administration", "subscription-charges");
    }
    const state = parseChargeState(searchParams);
    const route: AdministrationRoute = { kind: "subscription-charges", productId, state, unitId };
    return validRoute(
      location,
      route,
      administrationLinks.subscriptionCharges(unitId, productId, state),
    );
  }

  return notFoundRoute;
};

export const parseAdministrationRoute = (href: string): RouteParseResult<AdministrationRoute> => {
  const location = parseRouteLocation(href);
  if (location?.segments[0] !== "administration") {
    return notFoundRoute;
  }

  const { searchParams, segments } = location;
  if (segments.length === 1) {
    const search = readOptionalQuery(searchParams, "search", isSearch);
    const route: AdministrationRoute = { kind: "overview", ...(search ? { search } : {}) };
    return validRoute(location, route, administrationLinks.overview(route));
  }

  if (segments.length === 2 && segments[1] === "charges") {
    const state = parseChargeState(searchParams);
    const route: AdministrationRoute = { kind: "organisation-charges", state };
    return validRoute(location, route, administrationLinks.organisationCharges(state));
  }

  if (segments.length === 2 && segments[1] === "usage") {
    const route: AdministrationRoute = { kind: "organisation-usage" };
    return validRoute(location, route, administrationLinks.organisationUsage());
  }

  if (segments.length === 3 && segments[1] === "subscriptions") {
    const productId = parsedProductId(segments[2]);
    if (!productId) {
      return localNotFoundRoute("administration", "subscription-entry");
    }
    const route: AdministrationRoute = { kind: "subscription-entry", productId };
    return validRoute(location, route, administrationLinks.subscriptionEntry(productId));
  }

  if (segments[1] === "units" && segments.length >= 3) {
    return parseUnitRoute(location);
  }

  return notFoundRoute;
};
