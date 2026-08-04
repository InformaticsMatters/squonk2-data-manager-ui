import { type OrganisationPostBodyBody, type UnitPatchBodyBody } from "@/api/account-server";
import {
  getGetDefaultOrganisationQueryKey,
  getGetOrganisationsQueryKey,
  useCreateOrganisation,
} from "@/api/account-server/organisation";
import {
  getGetPersonalUnitQueryKey,
  getGetUnitsQueryKey,
  useCreateOrganisationUnit,
  useCreatePersonalUnit,
  useDeleteOrganisationUnit,
  useDeletePersonalUnit,
  usePatchUnit,
} from "@/api/account-server/unit";
import {
  useAddOrganisationUnitUser,
  useAddOrganisationUser,
  useDeleteOrganisationUnitUser,
  useDeleteOrganisationUser,
} from "@/api/account-server/user";
import { getGetProjectsQueryKey } from "@/api/data-manager/project";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import { getBillingDay } from "../utils/app/products";

/**
 * The generated key factories are the sole cache identity for Organisation & access data. Every
 * command refreshes the same generated prefixes, so no screen keeps a private aggregate of
 * organisations, units, members, or editors.
 */
const refreshAccess = async (queryClient: QueryClient) => {
  await Promise.all(
    [
      getGetOrganisationsQueryKey(),
      getGetUnitsQueryKey(),
      getGetPersonalUnitQueryKey(),
      getGetDefaultOrganisationQueryKey(),
      getGetProjectsQueryKey(),
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
};

export const useAccessCommands = () => {
  const queryClient = useQueryClient();
  const createOrganisation = useCreateOrganisation();
  const createUnit = useCreateOrganisationUnit();
  const createPersonalUnit = useCreatePersonalUnit();
  const patchUnit = usePatchUnit();
  const deleteUnit = useDeleteOrganisationUnit();
  const deletePersonalUnit = useDeletePersonalUnit();
  const addOrganisationUser = useAddOrganisationUser();
  const removeOrganisationUser = useDeleteOrganisationUser();
  const addUnitUser = useAddOrganisationUnitUser();
  const removeUnitUser = useDeleteOrganisationUnitUser();

  const run = async <TResult>(command: Promise<TResult>) => {
    const result = await command;
    await refreshAccess(queryClient);
    return result;
  };

  return {
    addOrganisationEditor: (orgId: string, userId: string) =>
      run(addOrganisationUser.mutateAsync({ orgId, userId })),
    addUnitMember: (unitId: string, userId: string) =>
      run(addUnitUser.mutateAsync({ unitId, userId })),
    createOrganisation: (data: OrganisationPostBodyBody) =>
      run(createOrganisation.mutateAsync({ data })),
    createPersonalUnit: () =>
      run(createPersonalUnit.mutateAsync({ data: { billing_day: getBillingDay() } })),
    createUnit: (orgId: string, name: string) =>
      run(createUnit.mutateAsync({ orgId, data: { name, billing_day: getBillingDay() } })),
    /** Personal units are deleted through their own generated resource, never `/unit/{unitId}`. */
    deleteUnit: (unitId: string, isPersonalUnit: boolean) =>
      run(isPersonalUnit ? deletePersonalUnit.mutateAsync() : deleteUnit.mutateAsync({ unitId })),
    removeOrganisationEditor: (orgId: string, userId: string) =>
      run(removeOrganisationUser.mutateAsync({ orgId, userId })),
    removeUnitMember: (unitId: string, userId: string) =>
      run(removeUnitUser.mutateAsync({ unitId, userId })),
    updateUnit: (unitId: string, data: UnitPatchBodyBody) =>
      run(patchUnit.mutateAsync({ unitId, data })),
  };
};
