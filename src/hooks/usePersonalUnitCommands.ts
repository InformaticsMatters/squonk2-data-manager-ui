import {
  getGetPersonalUnitQueryKey,
  getGetUnitsQueryKey,
  useCreatePersonalUnit,
} from "@/api/account-server/unit";
import { getGetProjectsQueryKey } from "@/api/data-manager/project";

import { useQueryClient } from "@tanstack/react-query";

import { getBillingDay } from "../utils/app/products";

/**
 * Creating the caller's own personal unit.
 *
 * The personal unit belongs to no one route family: Projects creates one to onboard a caller with
 * nowhere to work, Administration manages it, and Datasets bills against it. So the command sits
 * beside `useGetPersonalUnit`, above the families, rather than in any family's own command module —
 * a family reaching into another family's implementation is exactly what ADR 0002 excludes.
 *
 * It refreshes what the unit's existence changes: the unit itself, the grouped unit index every
 * family reads eligibility from, and the project index, whose creation eligibility follows the
 * units the caller belongs to. It deliberately does not refresh organisation membership, because
 * creating a personal unit does not make the caller a member of the default organisation that
 * houses it.
 */
export const useCreatePersonalUnitCommand = () => {
  const queryClient = useQueryClient();
  const createPersonalUnit = useCreatePersonalUnit();

  return async () => {
    const created = await createPersonalUnit.mutateAsync({
      data: { billing_day: getBillingDay() },
    });
    await Promise.all(
      [getGetPersonalUnitQueryKey(), getGetUnitsQueryKey(), getGetProjectsQueryKey()].map(
        (queryKey) => queryClient.invalidateQueries({ queryKey }),
      ),
    );
    return created;
  };
};
