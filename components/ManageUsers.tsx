import type { FC } from "react";

import { useGetUsers } from "@squonk/data-manager-client/user";

import { Autocomplete, Chip, TextField } from "@mui/material";
import type { AutocompleteChangeReason } from "@mui/material/useAutocomplete";

export interface ManageUsersProps {
  /**
   * User's username
   */
  currentUsername: string;
  /**
   * Array of current users
   */
  users: string[];
  /**
   * Whether the component should be in a loading state
   */
  isLoading?: boolean;
  /**
   * Text used for component ID and placeholder text, E.g. "editors".
   */
  title: string;
  /**
   * Called when a user is selected
   */
  onSelect: (value: string[]) => Promise<void> | void;
  /**
   * Called when a user is removed
   */
  onRemove: (value: string[]) => Promise<void> | void;
}

/**
 * Selector input that manages a list of users.
 *
 * The current user is assumed to always be included.
 */
export const ManageUsers: FC<ManageUsersProps> = ({
  currentUsername,
  users,
  isLoading = false,
  title,
  onSelect,
  onRemove,
}) => {
  const { data, isLoading: isUsersLoading } = useGetUsers();
  const availableUsers = data?.users ?? [];

  const loading = isUsersLoading || isLoading;

  const updateUsers = async (value: string[], reason: AutocompleteChangeReason) => {
    switch (reason) {
      case "selectOption": {
        // Isolate the user that has been added
        await onSelect(value);
        break;
      }
      case "removeOption": {
        // Isolate the user that has been removed
        await onRemove(value);
        break;
      }
    }
  };

  return (
    <Autocomplete
      disableClearable
      freeSolo
      fullWidth
      multiple
      disabled={loading}
      getOptionDisabled={(option) => option === currentUsername}
      id={title.toLowerCase().replace(/\s/g, "")}
      loading={loading}
      options={availableUsers.map((user) => user.username)}
      renderInput={(params) => <TextField {...params} label={title} />}
      renderTags={(value, getTagProps) =>
        value.map((option: string, index: number) => {
          const { onDelete, ...chipProps } = getTagProps({ index });
          return (
            <Chip
              label={option}
              variant="outlined"
              onDelete={option !== currentUsername ? onDelete : undefined}
              {...chipProps}
              key={option}
            />
          );
        })
      }
      value={[currentUsername, ...users]}
      onChange={(_, value, reason) => updateUsers(value, reason)}
    />
  );
};