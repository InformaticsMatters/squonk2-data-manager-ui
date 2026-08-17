import { type OrganisationAllDetail, type UnitAllDetail } from "@/api/account-server";

import { isUnclaimedProjectSubscription } from "../projects/projectCreation";
import {
  type AccessCaller,
  type AccessFactsFreshness,
  type AdministrationCapability,
  factsAreConfirmed,
  unconfirmedCapability,
} from "./capabilities";
import { type Subscription, type SubscriptionKind } from "./subscriptionFacts";

/**
 * Who the caller is against the unit a subscription belongs to, or would belong to. Every fact is
 * read from a generated resource: no rule here depends on an organisation, unit, or product name.
 */
export type SubscriptionCallerFacts = {
  caller: AccessCaller;
  freshness?: AccessFactsFreshness;
  /** Held by an Account Server evaluation account, which may only subscribe its own unit. */
  isEvaluator: boolean;
  /** Absent until the caller's own personal unit resource has answered. */
  isPersonalUnit?: boolean;
  /** Absent when the unit's organisation is not among the resources the caller can read. */
  organisation?: Pick<OrganisationAllDetail, "caller_is_member">;
  unit: Pick<UnitAllDetail, "caller_is_member" | "owner_id">;
};

/**
 * The authority every Account Server product endpoint requires: membership of the unit or of its
 * organisation, ownership of the unit, or platform administration. It is stated once because
 * creation, adjustment, and deletion all answer to it, and each named capability below adds only
 * what its own endpoint says beyond it.
 */
const callerHoldsUnitAuthority = (facts: SubscriptionCallerFacts): boolean =>
  facts.caller.isPlatformAdministrator ||
  facts.unit.owner_id === facts.caller.username ||
  facts.unit.caller_is_member ||
  facts.organisation?.caller_is_member === true;

const unitAuthority = (facts: SubscriptionCallerFacts, action: string): AdministrationCapability =>
  callerHoldsUnitAuthority(facts)
    ? { status: "enabled" }
    : {
        status: "disabled",
        reason: `You must be a member of this unit or its organisation to ${action}.`,
      };

/**
 * The generated endpoint restricts an evaluation account to its own personal unit. That rule rests
 * on which unit is the caller's own, so an evaluator is told nothing until that has been
 * established rather than being told the wrong thing early. `undefined` means the rule does not
 * apply and the ordinary unit authority decides.
 */
const evaluatorRestriction = (
  facts: SubscriptionCallerFacts,
  reason: string,
): AdministrationCapability | undefined => {
  if (!facts.isEvaluator) {
    return undefined;
  }
  if (facts.isPersonalUnit === undefined) {
    return unconfirmedCapability;
  }
  return facts.isPersonalUnit ? undefined : { status: "disabled", reason };
};

/** Creating the one subscription this task creates: a unit's dataset storage. */
export const evaluateDatasetSubscriptionCreationCapability = (
  facts: SubscriptionCallerFacts,
): AdministrationCapability => {
  if (!factsAreConfirmed(facts)) {
    return unconfirmedCapability;
  }
  return (
    evaluatorRestriction(
      facts,
      "Evaluation accounts can only subscribe their own personal unit.",
    ) ?? unitAuthority(facts, "create a subscription")
  );
};

/**
 * Adjusting a subscription. The generated patch accepts a member of the unit, a member of its
 * organisation, or an administrator, which is the same authority its creation requires.
 */
export const evaluateSubscriptionAdjustmentCapability = (
  facts: SubscriptionCallerFacts & { kind: SubscriptionKind },
): AdministrationCapability => {
  if (facts.kind === "unrecognised") {
    return {
      status: "disabled",
      reason: "This subscription's type is not one this application can adjust.",
    };
  }
  if (!factsAreConfirmed(facts)) {
    return unconfirmedCapability;
  }
  return unitAuthority(facts, "adjust this subscription");
};

/**
 * Deleting a subscription. The Account Server refuses to delete one a service resource still
 * claims, so a claimed subscription says which deletion has to happen first rather than offering
 * a request the server would reject.
 */
export const evaluateSubscriptionDeletionCapability = (
  facts: SubscriptionCallerFacts & { claimed: boolean },
): AdministrationCapability => {
  if (facts.claimed) {
    return {
      status: "disabled",
      reason: "Delete the project using this subscription before deleting the subscription.",
    };
  }
  if (!factsAreConfirmed(facts)) {
    return unconfirmedCapability;
  }
  return unitAuthority(facts, "delete this subscription");
};

/**
 * Handing a subscription to Project creation. Whether a project may still claim one is asked of the
 * Projects module, so Administration and Projects cannot disagree about which handoff is usable.
 * Beyond that, Administration decides only whether this caller could create a project in the
 * subscription's unit, which is the Account Server's own unit rule; the Projects route validates
 * the subscription identity itself and remains the only owner of what creating a project means.
 */
export const evaluateProjectHandoffCapability = (
  facts: SubscriptionCallerFacts & { product: Subscription },
): AdministrationCapability => {
  if (!isUnclaimedProjectSubscription(facts.product)) {
    return { status: "disabled", reason: "No project can claim this subscription." };
  }
  if (!factsAreConfirmed(facts)) {
    return unconfirmedCapability;
  }
  return (
    evaluatorRestriction(
      facts,
      "Evaluation accounts can only create projects in their own personal unit.",
    ) ?? unitAuthority(facts, "create a project in this subscription's unit")
  );
};
