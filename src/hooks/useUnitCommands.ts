import { getGetUnitsQueryKey, useCreateOrganisationUnit } from "@/api/account-server/unit";
import { getGetProjectsQueryKey } from "@/api/data-manager/project";

import { useQueryClient } from "@tanstack/react-query";

import { getBillingDay } from "../utils/app/products";

/**
 * Creating a unit in a named organisation.
 *
 * Like the personal unit beside it, a unit belongs to no one route family: Administration creates
 * one from the organisation it is displaying, Projects offers one beside **Create project**, and a
 * project or a dataset is then billed to it. So the command sits above the families, and the
 * billing day it defaults and the caches it refreshes have one definition rather than one per
 * screen offering the action.
 *
 * It refreshes what the unit's existence changes: the grouped unit index every family reads
 * eligibility from, and the project index, whose creation eligibility follows the units the caller
 * belongs to. It deliberately does not refresh organisation membership, because putting a unit in
 * an organisation does not change who belongs to that organisation.
 */
export const useCreateUnitCommand = () => {
  const queryClient = useQueryClient();
  const createUnit = useCreateOrganisationUnit();

  return async (orgId: string, name: string) => {
    const created = await createUnit.mutateAsync({
      orgId,
      data: { name, billing_day: getBillingDay() },
    });
    await Promise.all(
      [getGetUnitsQueryKey(), getGetProjectsQueryKey()].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
    return created;
  };
};
