import { useQueryClient } from "react-query";

import type { UnitDetail } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitUsersQueryKey,
  useAddOrganisationUnitUser,
  useDeleteOrganisationUnitUser,
  useGetOrganisationUnitUsers,
} from "@squonk/account-server-client/user";
import type { DmError } from "@squonk/data-manager-client";

import { ManageEditors } from "../../../../../components/ManageEditors";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";

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
  const { mutateAsync: addEditor, isLoading: isAdding } = useAddOrganisationUnitUser();
  const { mutateAsync: removeEditor, isLoading: isRemoving } = useDeleteOrganisationUnitUser();
  const queryClient = useQueryClient();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  if (users && currentUser.username) {
    return (
      <ManageEditors
        currentUsername={currentUser.username}
        editorsValue={users
          .filter((user) => user.id !== currentUser.username)
          .map((user) => user.id)}
        isLoading={isAdding || isRemoving || isUsersLoading}
        onRemove={async (value) => {
          const user = users.find((editor) => !value.includes(editor.id));
          if (user) {
            try {
              await removeEditor({ unitId: unit.id, userId: user.id });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            queryClient.invalidateQueries(getGetOrganisationUnitUsersQueryKey(unit.id));
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
            queryClient.invalidateQueries(getGetOrganisationUnitUsersQueryKey(unit.id));
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
      />
    );
  }
  return null;
};
