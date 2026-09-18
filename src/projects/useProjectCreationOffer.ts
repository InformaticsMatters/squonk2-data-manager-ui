import { useGetUnitsSuspense } from "@/api/account-server/unit";

import { useAccountFacts } from "../hooks/useAccountFacts";
import { useSelectedOrganisation } from "../state/organisationSelection";
import { type ProjectCapability } from "./capabilities";
import {
  eligibleProjectCreationUnits,
  type EligibleProjectUnit,
  evaluateProjectCreationCapability,
} from "./projectCreation";

/**
 * What project creation may do in the organisation in effect, and the units it would offer.
 *
 * The index offers the action and project creation carries it out, so both need the same answer.
 * Assembled once here rather than at each screen: the two would otherwise have to agree about the
 * organisation in effect, the caller's role and their personal unit by keeping three reads in step,
 * and a screen that offered what the next one refuses is the failure this replaces.
 */
export const useProjectCreationOffer = (): {
  capability: ProjectCapability;
  eligibleUnits: EligibleProjectUnit[];
  organisationId: string | undefined;
} => {
  const { data: unitGroups } = useGetUnitsSuspense();
  const { caller, freshness, personalUnitId } = useAccountFacts();
  // The identity, not the resource: the third entry is the organisation in effect by id, which is
  // all an offer needs. `unicorn/no-unreadable-array-destructuring` is why it is read positionally.
  const organisationId = useSelectedOrganisation()[2];
  const eligibleUnits = eligibleProjectCreationUnits(unitGroups.units, {
    evaluatorPersonalUnitId: personalUnitId,
    isEvaluator: !!caller.isEvaluator,
    organisationId,
  });

  return {
    capability: evaluateProjectCreationCapability({
      eligibleUnitCount: eligibleUnits.length,
      freshness,
      organisationId,
    }),
    eligibleUnits,
    organisationId,
  };
};
