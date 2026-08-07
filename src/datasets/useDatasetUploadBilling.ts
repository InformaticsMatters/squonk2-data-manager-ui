import { useCallback, useMemo, useState } from "react";

import { useGetProductsForUnit } from "@/api/account-server/product";
import { useGetUnits } from "@/api/account-server/unit";

import { useGetPersonalUnit } from "../hooks/useGetPersonalUnit";
import { useIsEvaluator } from "../hooks/useIsAuthorized";
import { evaluateDatasetUploadCapability } from "./capabilities";
import {
  type BillingUnit,
  type BillingUnitChoice,
  datasetSubscriptionOf,
  type DatasetSubscriptionRecovery,
  eligibleBillingUnits,
  evaluateDatasetSubscriptionRecovery,
  readRememberedBillingUnitId,
  rememberBillingUnitId,
  resolveBillingUnitChoice,
} from "./uploadBilling";

/**
 * Which units the caller may bill an upload to, and which of them the form is currently using.
 *
 * Membership comes from the generated unit index rather than from selected unit or organisation
 * state, so the units offered here are the ones the Account Server itself says the caller is in.
 * An index that has not answered — or could not — leaves the facts stale rather than empty.
 */
export const useBillingUnits = () => {
  const { data, isError, isPending } = useGetUnits();
  const [chosenUnitId, setChosenUnitId] = useState<string>();
  // Read once per mount: a memory the caller cannot see changing mid-batch is easier to trust than
  // one that could be rewritten by another tab while a selection is open. Reading before hydration
  // yields no memory rather than a mismatch, because the store is unreachable on the server.
  const [rememberedUnitId] = useState(() => readRememberedBillingUnitId(globalThis.localStorage));

  const eligible = useMemo(() => eligibleBillingUnits(data?.units ?? []), [data]);
  const choice: BillingUnitChoice = resolveBillingUnitChoice({
    chosenUnitId,
    eligible,
    rememberedUnitId,
  });
  const selected: BillingUnit | undefined =
    choice.kind === "none" ? undefined : eligible.find(({ unit }) => unit.id === choice.unitId);

  // Only ever called from a settled upload, which is a fact the browser established.
  const remember = useCallback((unitId: string) => {
    rememberBillingUnitId(globalThis.localStorage, unitId);
  }, []);

  return {
    capability: evaluateDatasetUploadCapability({
      eligibleUnitCount: eligible.length,
      freshness: isPending || isError ? "stale" : "current",
    }),
    choice,
    chooseUnit: setChosenUnitId,
    eligible,
    remember,
    selected,
  };
};

export type DatasetSubscriptionState =
  | { kind: "available" }
  /** `recovery` is absent while what this caller could do about it is still being established. */
  | { kind: "missing"; recovery?: DatasetSubscriptionRecovery }
  | { kind: "unresolved" };

/**
 * Whether the chosen billing unit can pay for a dataset, and what the caller can do when it cannot.
 *
 * Both facts are read from generated resources: the unit's own products decide the subscription,
 * and the personal-unit resource decides whether an evaluation account may subscribe this unit. A
 * products read that has not answered stays unresolved, leaving the Data Manager the authority on
 * whether the upload is funded rather than refusing it here on a fact nobody established. Once it
 * has answered, a unit with no subscription is missing one whatever the caller may do about it, so
 * a personal-unit read still in flight withholds the guidance alone: an evaluator is not told, for
 * as long as that read takes, to contact someone about a unit that may be its own.
 */
export const useDatasetSubscription = (
  billingUnit: BillingUnit | undefined,
): DatasetSubscriptionState => {
  const unitId = billingUnit?.unit.id;
  const { data, isError, isPending } = useGetProductsForUnit(unitId ?? "", {
    query: { enabled: !!unitId },
  });
  const { data: personalUnit, isPending: personalUnitIsPending } = useGetPersonalUnit();
  const isEvaluator = useIsEvaluator();

  if (!billingUnit || !unitId || isPending || isError) {
    return { kind: "unresolved" };
  }
  if (datasetSubscriptionOf(data)) {
    return { kind: "available" };
  }
  return {
    kind: "missing",
    recovery: evaluateDatasetSubscriptionRecovery({
      caller: { isEvaluator },
      // A personal-unit read that failed answered all the same: the caller has no personal unit.
      isPersonalUnit: personalUnitIsPending ? undefined : personalUnit?.id === unitId,
      organisation: billingUnit.organisation,
      unit: billingUnit.unit,
    }),
  };
};
