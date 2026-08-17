import {
  isOrganisationId,
  isProductId,
  isUnitId,
  type OrganisationId,
  type ProductId,
  type UnitId,
} from "../routing/identifiers";
import {
  assertRouteValue,
  buildHref,
  localNotFoundRoute,
  notFoundRoute,
  parseRouteLocation,
  readOptionalQuery,
  type RouteParseResult,
  validRoute,
} from "../routing/routeContract";

const resourceValidators = {
  organisations: isOrganisationId,
  products: isProductId,
  units: isUnitId,
} as const;

const sectionCollections = {
  charges: ["organisations", "products", "units"],
  organisationAccess: ["organisations", "units"],
  usageInventory: ["organisations", "units"],
} as const;

type ResourceIdByCollection = { organisations: OrganisationId; products: ProductId; units: UnitId };
type ResourceCollection = keyof ResourceIdByCollection;
export type ChargeRouteState = { billingCycle: number };
export type OrganisationAccessCollection = (typeof sectionCollections.organisationAccess)[number];
export type ChargeCollection = (typeof sectionCollections.charges)[number];
export type UsageInventoryCollection = (typeof sectionCollections.usageInventory)[number];

type ResourceRoute<TKind extends string, TCollection extends ResourceCollection> = {
  [TCurrentCollection in TCollection]: {
    kind: TKind;
    collection: TCurrentCollection;
    resourceId: ResourceIdByCollection[TCurrentCollection];
  };
}[TCollection];

export type ChargeResourceRoute = ResourceRoute<"charge-resource", ChargeCollection> & {
  state: ChargeRouteState;
};
type ChargesRoute = { kind: "charges" };
type OrganisationAccessResourceRoute = ResourceRoute<
  "organisation-access-resource",
  OrganisationAccessCollection
>;
type OrganisationAccessRoute = { kind: "organisation-access" };
type SubscriptionRoute = { kind: "subscription"; productId: ProductId };
type SubscriptionsRoute = { kind: "subscriptions" };
type UsageInventoryResourceRoute = ResourceRoute<
  "usage-inventory-resource",
  UsageInventoryCollection
>;
type UsageInventoryRoute = { kind: "usage-inventory" };

export type AdministrationRoute =
  | ChargeResourceRoute
  | ChargesRoute
  | OrganisationAccessResourceRoute
  | OrganisationAccessRoute
  | SubscriptionRoute
  | SubscriptionsRoute
  | UsageInventoryResourceRoute
  | UsageInventoryRoute;

const resourceIdIsValid = (
  collection: ChargeCollection | OrganisationAccessCollection | UsageInventoryCollection,
  resourceId: string,
): boolean => resourceValidators[collection](resourceId);

const parseResourceId = <TCollection extends ResourceCollection>(
  collection: TCollection,
  resourceId: string,
): ResourceIdByCollection[TCollection] | null =>
  resourceIdIsValid(collection, resourceId)
    ? (resourceId as ResourceIdByCollection[TCollection])
    : null;

const isCollection = <TCollection extends string>(
  value: string,
  collections: readonly TCollection[],
): value is TCollection => collections.includes(value as TCollection);

const resourcePath = <TCollection extends ResourceCollection>(
  base: string,
  collection: TCollection,
  resourceId: ResourceIdByCollection[TCollection],
) =>
  `${base}/${collection}/${assertRouteValue(
    resourceId,
    (value) => resourceIdIsValid(collection, value),
    `${collection} resource ID`,
  )}`;

const isBillingCycle = (value: string): boolean => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= -23 && parsed <= 0 && String(parsed) === value;
};

const parseChargeState = (searchParams: URLSearchParams): ChargeRouteState => ({
  billingCycle: Number(readOptionalQuery(searchParams, "billing-cycle", isBillingCycle) ?? 0),
});

const chargeResourcePath = <TCollection extends ChargeCollection>(
  collection: TCollection,
  resourceId: ResourceIdByCollection[TCollection],
  state?: ChargeRouteState,
) => {
  const billingCycle = assertRouteValue(
    String(state?.billingCycle ?? 0),
    isBillingCycle,
    "billing cycle",
  );
  return buildHref(resourcePath("/administration/charges", collection, resourceId), [
    ["billing-cycle", billingCycle === "0" ? undefined : billingCycle],
  ]);
};

export const administrationLinks = {
  organisationAccess: () => "/administration/organisation-access",
  organisationAccessResource: <TCollection extends OrganisationAccessCollection>(
    collection: TCollection,
    resourceId: ResourceIdByCollection[TCollection],
  ) => resourcePath("/administration/organisation-access", collection, resourceId),
  subscriptions: () => "/administration/subscriptions",
  subscription: (productId: ProductId) =>
    `/administration/subscriptions/${assertRouteValue(productId, isProductId, "product ID")}`,
  charges: () => "/administration/charges",
  chargeResource: <TCollection extends ChargeCollection>(
    collection: TCollection,
    resourceId: ResourceIdByCollection[TCollection],
    state?: ChargeRouteState,
  ) => chargeResourcePath(collection, resourceId, state),
  usageInventory: () => "/administration/usage-inventory",
  usageInventoryResource: <TCollection extends UsageInventoryCollection>(
    collection: TCollection,
    resourceId: ResourceIdByCollection[TCollection],
  ) => resourcePath("/administration/usage-inventory", collection, resourceId),
};

export const parseAdministrationRoute = (href: string): RouteParseResult<AdministrationRoute> => {
  const location = parseRouteLocation(href);
  if (location?.segments[0] !== "administration") {
    return notFoundRoute;
  }

  const { segments } = location;
  if (segments.length === 1 || (segments.length === 2 && segments[1] === "organisation-access")) {
    const route: AdministrationRoute = { kind: "organisation-access" };
    return validRoute(location, route, administrationLinks.organisationAccess());
  }

  if (segments.length === 4 && segments[1] === "organisation-access") {
    const collection = segments[2];
    if (!isCollection(collection, sectionCollections.organisationAccess)) {
      return localNotFoundRoute("administration", "organisation-access");
    }
    const resourceId = parseResourceId(collection, segments[3]);
    if (!resourceId) {
      return localNotFoundRoute("administration", "organisation-access");
    }
    const route = {
      kind: "organisation-access-resource",
      collection,
      resourceId,
    } as OrganisationAccessResourceRoute;
    return validRoute(
      location,
      route,
      administrationLinks.organisationAccessResource(collection, resourceId),
    );
  }

  if (segments.length === 2 && segments[1] === "subscriptions") {
    const route: AdministrationRoute = { kind: "subscriptions" };
    return validRoute(location, route, administrationLinks.subscriptions());
  }

  if (segments.length === 3 && segments[1] === "subscriptions" && isProductId(segments[2])) {
    const route: AdministrationRoute = { kind: "subscription", productId: segments[2] };
    return validRoute(location, route, administrationLinks.subscription(segments[2]));
  }

  if (segments.length === 3 && segments[1] === "subscriptions") {
    return localNotFoundRoute("administration", "subscriptions");
  }

  if (segments.length === 2 && segments[1] === "charges") {
    const route: AdministrationRoute = { kind: "charges" };
    return validRoute(location, route, administrationLinks.charges());
  }

  if (segments.length === 4 && segments[1] === "charges") {
    const collection = segments[2];
    if (!isCollection(collection, sectionCollections.charges)) {
      return localNotFoundRoute("administration", "charges");
    }
    const resourceId = parseResourceId(collection, segments[3]);
    if (!resourceId) {
      return localNotFoundRoute("administration", "charges");
    }
    const state = parseChargeState(location.searchParams);
    const route = { kind: "charge-resource", collection, resourceId, state } as ChargeResourceRoute;
    return validRoute(
      location,
      route,
      administrationLinks.chargeResource(collection, resourceId, state),
    );
  }

  if (segments.length === 2 && segments[1] === "usage-inventory") {
    const route: AdministrationRoute = { kind: "usage-inventory" };
    return validRoute(location, route, administrationLinks.usageInventory());
  }

  if (segments.length === 4 && segments[1] === "usage-inventory") {
    const collection = segments[2];
    if (!isCollection(collection, sectionCollections.usageInventory)) {
      return localNotFoundRoute("administration", "usage-inventory");
    }
    const resourceId = parseResourceId(collection, segments[3]);
    if (!resourceId) {
      return localNotFoundRoute("administration", "usage-inventory");
    }
    const route = {
      kind: "usage-inventory-resource",
      collection,
      resourceId,
    } as UsageInventoryResourceRoute;
    return validRoute(
      location,
      route,
      administrationLinks.usageInventoryResource(collection, resourceId),
    );
  }

  return notFoundRoute;
};
