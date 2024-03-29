import type { UnitDetail } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitUsersQueryKey,
  useAddOrganisationUnitUser,
  useDeleteOrganisationUnitUser,
  useGetOrganisationUnitUsers,
} from "@squonk/account-server-client/user";
import type { DmError } from "@squonk/data-manager-client";

import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { ManageUsers } from "../ManageUsers";

export interface UnitEditorsProps {
  /**
   * Unit to be edited.
   */
  unit: UnitDetail;
}

/**
 * MuiAutocomplete to manage the current editors of the selected project
 */
export const UnitEditors = ({ unit }: UnitEditorsProps) => {
  const { user: currentUser } = useKeycloakUser();

  const { data, isLoading: isUsersLoading } = useGetOrganisationUnitUsers(unit.id);
  const users = data?.users;
  const { mutateAsync: addEditor, isPending: isAdding } = useAddOrganisationUnitUser();
  const { mutateAsync: removeEditor, isPending: isRemoving } = useDeleteOrganisationUnitUser();
  const queryClient = useQueryClient();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  if (users && currentUser.username) {
    return (
      <ManageUsers
        isLoading={isAdding || isRemoving || isUsersLoading}
        title="Unit Editors"
        users={users.filter((user) => user.id !== currentUser.username).map((user) => user.id)}
        onRemove={async (value) => {
          const user = users.find((editor) => !value.includes(editor.id));
          if (user) {
            try {
              await removeEditor({ unitId: unit.id, userId: user.id });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            queryClient.invalidateQueries({
              queryKey: getGetOrganisationUnitUsersQueryKey(unit.id),
            });
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
        onSelect={async (value) => {
          const username = value.reverse().find((user) => !users.map((u) => u.id).includes(user));
          if (username) {
            try {
              await addEditor({ unitId: unit.id, userId: username });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            queryClient.invalidateQueries({
              queryKey: getGetOrganisationUnitUsersQueryKey(unit.id),
            });
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
      />
    );
  }
  return null;
};
