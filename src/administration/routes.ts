import { isOrganisationId, isProductId, isUnitId } from "../routing/identifiers";
import {
  assertRouteValue,
  localNotFoundRoute,
  notFoundRoute,
  parseRouteLocation,
  type RouteParseResult,
  validRoute,
} from "../routing/routeContract";

export type OrganisationAccessCollection = "organisations" | "units";
export type ChargeCollection = "organisations" | "products" | "units";
export type UsageInventoryCollection = "organisations" | "units";

type ChargeResourceRoute = {
  kind: "charge-resource";
  collection: ChargeCollection;
  resourceId: string;
};
type ChargesRoute = { kind: "charges" };
type OrganisationAccessResourceRoute = {
  kind: "organisation-access-resource";
  collection: OrganisationAccessCollection;
  resourceId: string;
};
type OrganisationAccessRoute = { kind: "organisation-access" };
type SubscriptionRoute = { kind: "subscription"; productId: string };
type SubscriptionsRoute = { kind: "subscriptions" };
type UsageInventoryResourceRoute = {
  kind: "usage-inventory-resource";
  collection: UsageInventoryCollection;
  resourceId: string;
};
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
): boolean => {
  switch (collection) {
    case "organisations":
      return isOrganisationId(resourceId);
    case "units":
      return isUnitId(resourceId);
    case "products":
      return isProductId(resourceId);
  }
};

const resourcePath = <TCollection extends string>(
  base: string,
  collection: TCollection,
  resourceId: string,
) =>
  `${base}/${collection}/${assertRouteValue(
    resourceId,
    (value) => resourceIdIsValid(collection as ChargeCollection, value),
    `${collection} resource ID`,
  )}`;

export const administrationLinks = {
  organisationAccess: () => "/administration/organisation-access",
  organisationAccessResource: (collection: OrganisationAccessCollection, resourceId: string) =>
    resourcePath("/administration/organisation-access", collection, resourceId),
  subscriptions: () => "/administration/subscriptions",
  subscription: (productId: string) =>
    `/administration/subscriptions/${assertRouteValue(productId, isProductId, "product ID")}`,
  charges: () => "/administration/charges",
  chargeResource: (collection: ChargeCollection, resourceId: string) =>
    resourcePath("/administration/charges", collection, resourceId),
  usageInventory: () => "/administration/usage-inventory",
  usageInventoryResource: (collection: UsageInventoryCollection, resourceId: string) =>
    resourcePath("/administration/usage-inventory", collection, resourceId),
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
    const collection = segments[2] as OrganisationAccessCollection;
    const resourceId = segments[3];
    if (
      !(["organisations", "units"] as const).includes(collection) ||
      !resourceIdIsValid(collection, resourceId)
    ) {
      return localNotFoundRoute("administration", "organisation-access");
    }
    const route: AdministrationRoute = {
      kind: "organisation-access-resource",
      collection,
      resourceId,
    };
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
    const collection = segments[2] as ChargeCollection;
    const resourceId = segments[3];
    if (
      !(["organisations", "units", "products"] as const).includes(collection) ||
      !resourceIdIsValid(collection, resourceId)
    ) {
      return localNotFoundRoute("administration", "charges");
    }
    const route: AdministrationRoute = { kind: "charge-resource", collection, resourceId };
    return validRoute(location, route, administrationLinks.chargeResource(collection, resourceId));
  }

  if (segments.length === 2 && segments[1] === "usage-inventory") {
    const route: AdministrationRoute = { kind: "usage-inventory" };
    return validRoute(location, route, administrationLinks.usageInventory());
  }

  if (segments.length === 4 && segments[1] === "usage-inventory") {
    const collection = segments[2] as UsageInventoryCollection;
    const resourceId = segments[3];
    if (
      !(["organisations", "units"] as const).includes(collection) ||
      !resourceIdIsValid(collection, resourceId)
    ) {
      return localNotFoundRoute("administration", "usage-inventory");
    }
    const route: AdministrationRoute = { kind: "usage-inventory-resource", collection, resourceId };
    return validRoute(
      location,
      route,
      administrationLinks.usageInventoryResource(collection, resourceId),
    );
  }

  return notFoundRoute;
};
