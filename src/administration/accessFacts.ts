import {
  type OrganisationAllDetail,
  type OrganisationUnitsGetResponse,
  type UnitAllDetail,
} from "@/api/account-server";
import { useGetOrganisation, useGetOrganisationsSuspense } from "@/api/account-server/organisation";
import { useGetProduct } from "@/api/account-server/product";
import { useGetUnit, useGetUnitsSuspense } from "@/api/account-server/unit";

import {
  classifyTransportFailure,
  type TransportFailure,
} from "../api/runtime/classifyTransportFailure";
import { type AccountFacts, useAccountFacts } from "../hooks/useAccountFacts";
import { administrationReadIsAuthoritative } from "./failures";
import { type Subscription } from "./subscriptionFacts";

export type UnitWithOrganisation = { organisation: OrganisationAllDetail; unit: UnitAllDetail };

export type AccessFacts = AccountFacts;

const flattenUnits = (groups: OrganisationUnitsGetResponse[]): UnitWithOrganisation[] =>
  groups.flatMap(({ organisation, units }) => units.map((unit) => ({ organisation, unit })));

export const useAccessIndex = () => {
  const { data: organisations } = useGetOrganisationsSuspense();
  const { data: unitGroups } = useGetUnitsSuspense();
  return { organisations: organisations.organisations, units: flattenUnits(unitGroups.units) };
};

/**
 * What the addressed resource itself answered. `unavailable` carries the authoritative transport
 * fact so the screen can explain a denial and an absence apart; retryable facts never reach here
 * because they are rethrown to the task-level retry boundary.
 */
export type AddressedResource<TResource> =
  | { kind: "available"; resource: TResource }
  | { kind: "pending" }
  | { kind: "unavailable"; failure: TransportFailure };

/**
 * Only a failure the resource did not answer for itself is worth repeating, which is the one retry
 * rule every Administration read follows.
 */
export const retryAdministrationRead = (failureCount: number, error: unknown) =>
  !administrationReadIsAuthoritative(error) && failureCount < 3;

/**
 * The addressed resource is read from its own generated resource, never from the caller's index, so
 * a resource the caller may read but does not list is not mistaken for an absent one.
 */
const addressedResourceQuery = {
  retry: retryAdministrationRead,
  throwOnError: (error: unknown) => !administrationReadIsAuthoritative(error),
};

const toAddressedResource = <TResource>({
  data,
  error,
  isError,
}: {
  data: TResource | undefined;
  error: unknown;
  isError: boolean;
}): AddressedResource<TResource> => {
  if (isError) {
    return { failure: classifyTransportFailure(error), kind: "unavailable" };
  }
  return data === undefined ? { kind: "pending" } : { kind: "available", resource: data };
};

export const useAddressedOrganisation = (
  organisationId: string,
): AddressedResource<OrganisationAllDetail> =>
  toAddressedResource(useGetOrganisation(organisationId, { query: addressedResourceQuery }));

export const useAddressedUnit = (unitId: string): AddressedResource<UnitAllDetail> =>
  toAddressedResource(useGetUnit(unitId, { query: addressedResourceQuery }));

/**
 * The addressed subscription. The Account Server answers for a product the caller may read but does
 * not list, so the product index is never consulted to decide whether one exists.
 */
export const useAddressedProduct = (productId: string): AddressedResource<Subscription> =>
  toAddressedResource(
    useGetProduct(productId, {
      query: { ...addressedResourceQuery, select: ({ product }) => product },
    }),
  );

/**
 * The organisation a unit belongs to is only ever named by the caller's grouped units, so a unit
 * readable outside that index keeps its identity and loses nothing but its ancestry.
 */
export const useUnitAncestry = (unitId: string): OrganisationAllDetail | undefined =>
  useAccessIndex().units.find(({ unit }) => unit.id === unitId)?.organisation;

/**
 * Resolves caller authority, personal-unit identity, and default-organisation identity from their
 * own generated resources.
 *
 * Projects reads the same facts to decide the unit offer it makes beside **Create project**, so the
 * assembly itself sits above the families and this is the name Administration knows it by. Nothing
 * about what Administration's screens read changes here.
 */
export const useAccessFacts = (): AccessFacts => useAccountFacts();
