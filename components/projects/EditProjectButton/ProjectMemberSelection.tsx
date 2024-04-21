import { type DmError } from "@squonk/data-manager-client";

import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { ManageUsers } from "../../ManageUsers";

type Callback = (userId: string) => Promise<void>;

export interface ProjectMemberSelectionProps {
  title: string;
  /**
   * Project to be edited.
   */
  memberList: string[];
  addMember: Callback;
  removeMember: Callback;
  onSettled: () => Promise<unknown>;
  /**
   * Loading state of async operations
   */
  isLoading: boolean;
}

/**
 * MuiAutocomplete to manage the current editors of the selected project
 */
export const ProjectMemberSelection = ({
  title,
  memberList,
  addMember,
  removeMember,
  onSettled,
  isLoading,
}: ProjectMemberSelectionProps) => {
  const { user: currentUser } = useKeycloakUser();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  if (currentUser.username) {
    return (
      <ManageUsers
        isLoading={isLoading}
        title={title}
        users={memberList}
        onRemove={async (value) => {
          const username = memberList.find((editor) => !value.includes(editor));
          if (username) {
            try {
              await removeMember(username);
            } catch (error) {
              enqueueError(error);
            }
            await onSettled();
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
        onSelect={async (value) => {
          const username = value.at(-1);
          if (username) {
            try {
              await addMember(username);
            } catch (error) {
              enqueueError(error);
            }
            await onSettled();
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
      />
    );
  }
  return null;
};
