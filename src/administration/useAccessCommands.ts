import {
  type OrganisationPatchBodyBody,
  type OrganisationPostBodyBody,
  type UnitPatchBodyBody,
} from "@/api/account-server";
import {
  getGetDefaultOrganisationQueryKey,
  getGetOrganisationsQueryKey,
  useCreateOrganisation,
  usePatchOrganisation,
} from "@/api/account-server/organisation";
import {
  getGetPersonalUnitQueryKey,
  getGetUnitsQueryKey,
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

import { useCreatePersonalUnitCommand } from "../hooks/usePersonalUnitCommands";
import { useCreateUnitCommand } from "../hooks/useUnitCommands";

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
  // Neither unit command is Administration's own: the projects index offers both of them too, so
  // each is owned above the families and this screen sends the one definition of it. Their own
  // refreshes cover the unit and project indexes; `run` then refreshes the rest of the access index
  // this screen shows.
  const createUnit = useCreateUnitCommand();
  const createPersonalUnit = useCreatePersonalUnitCommand();
  const patchOrganisation = usePatchOrganisation();
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
    addOrganisationMember: (orgId: string, userId: string) =>
      run(addOrganisationUser.mutateAsync({ orgId, userId })),
    addUnitMember: (unitId: string, userId: string) =>
      run(addUnitUser.mutateAsync({ unitId, userId })),
    createOrganisation: (data: OrganisationPostBodyBody) =>
      run(createOrganisation.mutateAsync({ data })),
    createPersonalUnit: () => run(createPersonalUnit()),
    createUnit: (orgId: string, name: string) => run(createUnit(orgId, name)),
    /** Personal units are deleted through their own generated resource, never `/unit/{unitId}`. */
    deleteUnit: (unitId: string, isPersonalUnit: boolean) =>
      run(isPersonalUnit ? deletePersonalUnit.mutateAsync() : deleteUnit.mutateAsync({ unitId })),
    removeOrganisationMember: (orgId: string, userId: string) =>
      run(removeOrganisationUser.mutateAsync({ orgId, userId })),
    removeUnitMember: (unitId: string, userId: string) =>
      run(removeUnitUser.mutateAsync({ unitId, userId })),
    updateOrganisation: (orgId: string, data: OrganisationPatchBodyBody) =>
      run(patchOrganisation.mutateAsync({ orgId, data })),
    updateUnit: (unitId: string, data: UnitPatchBodyBody) =>
      run(patchUnit.mutateAsync({ unitId, data })),
  };
};
