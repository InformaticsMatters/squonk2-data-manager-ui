import { type UnitDetail } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitUsersQueryKey,
  useAddOrganisationUnitUser,
  useDeleteOrganisationUnitUser,
  useGetOrganisationUnitUsers,
} from "@squonk/account-server-client/user";
import { type DmError } from "@squonk/data-manager-client";

import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { CenterLoader } from "../CenterLoader";
import { ManageUsers } from "../ManageUsers";

export interface UnitMembersProps {
  /**
   * Unit to be edited.
   */
  unit: UnitDetail;
}

/**
 * MuiAutocomplete to manage the current members of the selected project
 */
export const UnitMembers = ({ unit }: UnitMembersProps) => {
  const { user: currentUser } = useKeycloakUser();

  const [organisation] = useSelectedOrganisation();

  const { data, isLoading: isUsersLoading } = useGetOrganisationUnitUsers(unit.id, {
    query: { enabled: !!unit.caller_is_member || organisation?.caller_is_member },
  });
  const users = data?.users ?? [];
  const { mutateAsync: addMember, isPending: isAdding } = useAddOrganisationUnitUser();
  const { mutateAsync: removeMember, isPending: isRemoving } = useDeleteOrganisationUnitUser();
  const queryClient = useQueryClient();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const isOrganisationMember = organisation?.caller_is_member;
  const isUnitMember = unit.caller_is_member;
  const isPersonalUnit = organisation?.name === process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME;

  const helperText = isPersonalUnit
    ? "Members of personal unit may not be changed"
    : !isOrganisationMember || !isUnitMember
      ? "You must be a unit or organisation member to view and modify unit members"
      : undefined;

  if (isUsersLoading) {
    return <CenterLoader />;
  }

  if (currentUser.username) {
    return (
      <ManageUsers
        disabled={!!helperText}
        disabledUsers={[unit.owner_id]}
        helperText={helperText}
        isLoading={isAdding || isRemoving || isUsersLoading}
        title="Unit Members"
        users={users.map((user) => user.id)}
        onRemove={async (value) => {
          const user = users.find((member) => !value.includes(member.id));
          if (user) {
            try {
              await removeMember({ unitId: unit.id, userId: user.id });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            void queryClient.invalidateQueries({
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
              await addMember({ unitId: unit.id, userId: username });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            void queryClient.invalidateQueries({
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
