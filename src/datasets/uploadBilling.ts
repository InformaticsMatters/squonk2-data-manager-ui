import {
  type OrganisationAllDetail,
  type OrganisationUnitsGetResponse,
  type ProductDmStorage,
  type ProductsGetResponse,
  type UnitAllDetail,
} from "@/api/account-server";

import { administrationLinks } from "../administration/routes";
import { isUnitId } from "../routing/identifiers";

/** A unit an upload can be billed to, kept with the organisation the generated index grouped it under. */
export type BillingUnit = { organisation: OrganisationAllDetail; unit: UnitAllDetail };

/**
 * Which units a dataset upload may name as its billing context. The Data Manager requires a
 * `unit_id` on every upload, and the generated unit index is the only thing that says whether the
 * caller is in a unit, so membership is read from the resource rather than from whichever unit or
 * organisation happens to be selected elsewhere in the application.
 */
export const eligibleBillingUnits = (
  groups: readonly OrganisationUnitsGetResponse[],
): BillingUnit[] =>
  groups.flatMap(({ organisation, units }) =>
    units.filter((unit) => unit.caller_is_member).map((unit) => ({ organisation, unit })),
  );

/**
 * The billing unit an upload will use. `remembered` is the one convenience this form allows: the
 * unit of the caller's most recent successful upload, and only while that unit is still eligible.
 * Everything else selects nothing, so a batch is never billed to a unit nobody chose.
 */
export type BillingUnitChoice =
  | { kind: "chosen"; unitId: string }
  | { kind: "none" }
  | { kind: "remembered"; unitId: string };

export const resolveBillingUnitChoice = ({
  chosenUnitId,
  eligible,
  rememberedUnitId,
}: {
  chosenUnitId?: string;
  eligible: readonly BillingUnit[];
  rememberedUnitId?: string;
}): BillingUnitChoice => {
  const isEligible = (unitId: string) => eligible.some(({ unit }) => unit.id === unitId);
  if (chosenUnitId !== undefined && isEligible(chosenUnitId)) {
    return { kind: "chosen", unitId: chosenUnitId };
  }
  if (rememberedUnitId !== undefined && isEligible(rememberedUnitId)) {
    return { kind: "remembered", unitId: rememberedUnitId };
  }
  return { kind: "none" };
};

/** Datasets are billed against a unit's storage subscription; the product type is the whole test. */
export const datasetSubscriptionOf = (
  products: Pick<ProductsGetResponse, "products">,
): ProductDmStorage | undefined =>
  products.products.find(
    (product): product is ProductDmStorage =>
      product.product.type === "DATA_MANAGER_STORAGE_SUBSCRIPTION",
  );

export type DatasetSubscriptionRecovery =
  | { href: string; kind: "administration" }
  | { kind: "contact"; reason: string };

/**
 * What a caller can actually do about a unit with no dataset subscription.
 *
 * The Account Server creates a unit product for a member of the unit or of its organisation, except
 * that an evaluator may only create one in its own personal unit. A caller who does not meet that
 * rule is sent to a person rather than to a screen that would refuse them.
 */
export const evaluateDatasetSubscriptionRecovery = ({
  caller,
  isPersonalUnit,
  organisation,
  unit,
}: {
  caller: { isEvaluator: boolean };
  isPersonalUnit: boolean;
  /** Absent when the unit's organisation is not readable by this caller. */
  organisation?: Pick<OrganisationAllDetail, "caller_is_member">;
  unit: Pick<UnitAllDetail, "caller_is_member">;
}): DatasetSubscriptionRecovery => {
  const contact = {
    kind: "contact",
    reason:
      "Ask a member of this unit, or of its organisation, to create a dataset subscription for it.",
  } as const;
  if (caller.isEvaluator && !isPersonalUnit) {
    return {
      kind: "contact",
      reason:
        "Evaluation accounts can only subscribe their own personal unit. Ask a member of this unit to create a dataset subscription for it.",
    };
  }
  return unit.caller_is_member || organisation?.caller_is_member === true
    ? { href: administrationLinks.subscriptions(), kind: "administration" }
    : contact;
};

export const DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY = "data-manager-ui-dataset-upload-unit";

interface PersistedBillingUnitChoice {
  unitId: string;
  version: 1;
}

/**
 * A remembered choice is only ever a unit identity the Account Server would recognise, so a stale
 * or hand-edited payload is read as no memory at all rather than as a unit to bill.
 */
export const parseRememberedBillingUnitId = (value: unknown): string | undefined => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("unitId" in value) ||
    typeof value.unitId !== "string" ||
    !isUnitId(value.unitId)
  ) {
    return undefined;
  }
  return value.unitId;
};

export const readRememberedBillingUnitId = (
  storage: Pick<Storage, "getItem">,
): string | undefined => {
  try {
    const value = storage.getItem(DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY);
    return value === null ? undefined : parseRememberedBillingUnitId(JSON.parse(value));
  } catch {
    return undefined;
  }
};

export const rememberBillingUnitId = (storage: Pick<Storage, "setItem">, unitId: string) => {
  if (!isUnitId(unitId)) {
    return;
  }
  const value: PersistedBillingUnitChoice = { unitId, version: 1 };
  storage.setItem(DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY, JSON.stringify(value));
};

export const forgetRememberedBillingUnit = (storage: Pick<Storage, "removeItem">) => {
  storage.removeItem(DATASET_UPLOAD_BILLING_UNIT_STORAGE_KEY);
};
