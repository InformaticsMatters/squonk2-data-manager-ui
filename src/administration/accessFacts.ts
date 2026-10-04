import {
  getGetOrganisationChargesSuspenseQueryOptions,
  getGetProductChargesSuspenseQueryOptions,
  getGetUnitChargesSuspenseQueryOptions,
} from "@/api/account-server/charges";
import { getGetOrganisationSuspenseQueryOptions } from "@/api/account-server/organisation";
import {
  getGetProductsForUnitSuspenseQueryOptions,
  getGetProductSuspenseQueryOptions,
} from "@/api/account-server/product";
import { getGetUnitSuspenseQueryOptions } from "@/api/account-server/unit";

import { type AccountFacts, useAccountFacts } from "../hooks/useAccountFacts";
import { administrationReadIsAuthoritative } from "./failures";

export type AccessFacts = AccountFacts;

/**
 * Only a failure the resource did not answer for itself is worth repeating, which is the one retry
 * rule every Administration read follows.
 */
export const retryAdministrationRead = (failureCount: number, error: unknown) =>
  !administrationReadIsAuthoritative(error) && failureCount < 3;

/**
 * The addressed resource is read from its own generated resource, never from the caller's index, so
 * a resource the caller may read but does not list is not mistaken for an absent one.
 *
 * Each is a suspense read, so a section's reads resolve together behind its skeleton. A suspense
 * read throws whatever it fails with; `AddressedResourceView` catches an authoritative refusal where
 * the resource is, and every other failure reaches the frame's retry boundary.
 */
const addressedResourceQuery = { retry: retryAdministrationRead };

export const addressedOrganisationRead = (organisationId: string) =>
  getGetOrganisationSuspenseQueryOptions(organisationId, { query: addressedResourceQuery });

export const addressedUnitRead = (unitId: string) =>
  getGetUnitSuspenseQueryOptions(unitId, { query: addressedResourceQuery });

/**
 * The addressed subscription. The Account Server answers for a product the caller may read but does
 * not list, so the product index is never consulted to decide whether one exists.
 */
export const addressedProductRead = (productId: string) =>
  getGetProductSuspenseQueryOptions(productId, {
    query: { ...addressedResourceQuery, select: ({ product }) => product },
  });

/**
 * A unit's own subscriptions, read from the unit-scoped product endpoint and through the same
 * contract as every other addressed read — so a refusal is stated inside the unit rather than
 * throwing past its identity and tab strip to the workspace boundary.
 */
export const addressedUnitProductsRead = (unitId: string) =>
  getGetProductsForUnitSuspenseQueryOptions(unitId, { query: addressedResourceQuery });

/** A ledger is a large report of one billing period, so it is given longer than an ordinary read. */
const chargeRequest = { timeout: 30_000 };

/**
 * The charge ledgers, read through the same contract as every other addressed resource, which is
 * what makes a refused ledger say so where the ledger is instead of taking the section frame down
 * with it.
 */
export const addressedOrganisationChargesRead = (organisationId: string, billingCycle: number) =>
  getGetOrganisationChargesSuspenseQueryOptions(
    organisationId,
    { pbp: billingCycle },
    { query: addressedResourceQuery, request: chargeRequest },
  );

export const addressedUnitChargesRead = (unitId: string, billingCycle: number) =>
  getGetUnitChargesSuspenseQueryOptions(
    unitId,
    { pbp: billingCycle },
    { query: addressedResourceQuery, request: chargeRequest },
  );

export const addressedProductChargesRead = (productId: string, billingCycle: number) =>
  getGetProductChargesSuspenseQueryOptions(
    productId,
    { pbp: billingCycle },
    { query: addressedResourceQuery, request: chargeRequest },
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
