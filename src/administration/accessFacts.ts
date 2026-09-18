import {
  type OrganisationAllDetail,
  type OrganisationChargesGetResponse,
  type ProductChargesGetResponse,
  type ProductsGetResponse,
  type UnitAllDetail,
  type UnitChargesGetResponse,
} from "@/api/account-server";
import {
  useGetOrganisationCharges,
  useGetProductCharges,
  useGetUnitCharges,
} from "@/api/account-server/charges";
import { useGetOrganisation } from "@/api/account-server/organisation";
import { useGetProduct, useGetProductsForUnit } from "@/api/account-server/product";
import { useGetUnit } from "@/api/account-server/unit";

import {
  classifyTransportFailure,
  type TransportFailure,
} from "../api/runtime/classifyTransportFailure";
import { type AccountFacts, useAccountFacts } from "../hooks/useAccountFacts";
import { administrationReadIsAuthoritative } from "./failures";
import { type Subscription } from "./subscriptionFacts";

export type AccessFacts = AccountFacts;

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
 * A unit's own subscriptions, read from the unit-scoped product endpoint and through the same
 * contract as every other addressed read — so a refusal is stated inside the unit rather than
 * throwing past its identity and tab strip to the workspace boundary.
 */
export const useAddressedUnitProducts = (unitId: string): AddressedResource<ProductsGetResponse> =>
  toAddressedResource(useGetProductsForUnit(unitId, { query: addressedResourceQuery }));

/** A ledger is a large report of one billing period, so it is given longer than an ordinary read. */
const chargeRequest = { timeout: 30_000 };

/**
 * The charge ledgers, read through the same contract as every other addressed resource rather than
 * through raw suspense reads of their own.
 *
 * That is what makes a refused ledger say so where the ledger is, instead of taking the section
 * frame down with it, while a transport fact the ledger did not answer for still reaches the
 * frame's retry boundary — one read and failure contract across the whole workspace.
 */
export const useAddressedOrganisationCharges = (
  organisationId: string,
  billingCycle: number,
): AddressedResource<OrganisationChargesGetResponse> =>
  toAddressedResource(
    useGetOrganisationCharges(
      organisationId,
      { pbp: billingCycle },
      { query: addressedResourceQuery, request: chargeRequest },
    ),
  );

export const useAddressedUnitCharges = (
  unitId: string,
  billingCycle: number,
): AddressedResource<UnitChargesGetResponse> =>
  toAddressedResource(
    useGetUnitCharges(
      unitId,
      { pbp: billingCycle },
      { query: addressedResourceQuery, request: chargeRequest },
    ),
  );

export const useAddressedProductCharges = (
  productId: string,
  billingCycle: number,
): AddressedResource<ProductChargesGetResponse> =>
  toAddressedResource(
    useGetProductCharges(
      productId,
      { pbp: billingCycle },
      { query: addressedResourceQuery, request: chargeRequest },
    ),
  );

/**
 * Resolves caller authority, personal-unit identity, and default-organisation identity from their
 * own generated resources.
 *
 * Projects reads the same facts to decide the unit offer it makes beside **Create project**, so the
 * assembly itself sits above the families and this is the name Administration knows it by. Nothing
 * about what Administration's screens read changes here.
 */
export const useAccessFacts = (): AccessFacts => useAccountFacts();
