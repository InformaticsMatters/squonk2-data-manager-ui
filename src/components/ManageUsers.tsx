import { type FC } from "react";

import { useGetUsers } from "@squonk/data-manager-client/user";

import { Autocomplete, Chip, TextField } from "@mui/material";
import { type AutocompleteChangeReason } from "@mui/material/useAutocomplete";

export interface ManageUsersProps {
  /**
   * Array of current users
   */
  users: string[];
  /**
   * Users that will be displayed but not selectable
   */
  disabledUsers?: string[];
  /**
   * Whether the component should be in a loading state
   */
  isLoading?: boolean;
  /**
   * Whether the field should be disabled. Overridden by loading state.
   */
  disabled?: boolean;
  /**
   * Text to display under the field
   */
  helperText?: string;
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
  users,
  disabledUsers = [],
  isLoading = false,
  disabled = false,
  title,
  helperText,
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

  // TODO: when removing yourself, allow a warning dialog to be displayed

  return (
    <Autocomplete
      disableClearable
      freeSolo
      fullWidth
      multiple
      disabled={disabled || loading}
      getOptionDisabled={(user) => disabledUsers.includes(user)}
      id={title.toLowerCase().replace(/\s/gu, "")}
      loading={loading}
      options={availableUsers.map((user) => user.username)}
      renderInput={(params) => <TextField {...params} helperText={helperText} label={title} />}
      renderTags={(value, getTagProps) =>
        value.map((option: string, index: number) => {
          const { onDelete, ...chipProps } = getTagProps({ index });
          return (
            <Chip
              label={option}
              variant="outlined"
              onDelete={onDelete}
              {...chipProps}
              key={option}
            />
          );
        })
      }
      value={users}
      onChange={(_, value, reason) => void updateUsers(value, reason)}
    />
  );
};
