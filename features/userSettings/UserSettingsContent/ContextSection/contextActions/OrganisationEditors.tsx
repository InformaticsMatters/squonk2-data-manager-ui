import type { OrganisationDetail } from "@squonk/account-server-client";
import {
  getGetOrganisationUsersQueryKey,
  useAddOrganisationUser,
  useDeleteOrganisationUser,
  useGetOrganisationUsers,
} from "@squonk/account-server-client/user";
import type { DmError } from "@squonk/data-manager-client";

import { useQueryClient } from "@tanstack/react-query";

import { ManageUsers } from "../../../../../components/ManageUsers";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";

export interface UnitEditorsProps {
  /**
   * Unit to be edited.
   */
  organisation: OrganisationDetail;
}

/**
 * MuiAutocomplete to manage the current editors of the selected project
 */
export const OrganisationEditors = ({ organisation }: UnitEditorsProps) => {
  const { user: currentUser } = useKeycloakUser();

  const { data, isLoading: isUsersLoading } = useGetOrganisationUsers(organisation.id);
  const users = data?.users;
  const { mutateAsync: addEditor, isPending: isAdding } = useAddOrganisationUser();
  const { mutateAsync: removeEditor, isPending: isRemoving } = useDeleteOrganisationUser();
  const queryClient = useQueryClient();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  if (users && currentUser.username) {
    return (
      <ManageUsers
        isLoading={isAdding || isRemoving || isUsersLoading}
        title="Organisation Editors"
        users={users.filter((user) => user.id !== currentUser.username).map((user) => user.id)}
        onRemove={async (value) => {
          const user = users.find((editor) => !value.includes(editor.id));
          if (user) {
            try {
              await removeEditor({ orgId: organisation.id, userId: user.id });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            queryClient.invalidateQueries({
              queryKey: getGetOrganisationUsersQueryKey(organisation.id),
            });
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
        onSelect={async (value) => {
          const username = value.reverse().find((user) => !users.map((u) => u.id).includes(user));
          if (username) {
            try {
              await addEditor({ orgId: organisation.id, userId: username });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            queryClient.invalidateQueries({
              queryKey: getGetOrganisationUsersQueryKey(organisation.id),
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
