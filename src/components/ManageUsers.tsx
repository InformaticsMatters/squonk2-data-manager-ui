import { type FC } from "react";

import { useGetUsers } from "@/api/data-manager/user";

import { Cancel as CancelIcon } from "@mui/icons-material";
import { Autocomplete, Chip, TextField } from "@mui/material";
import { type AutocompleteChangeReason } from "@mui/material/useAutocomplete";

export interface ManageUsersProps {
  /**
   * Array of current users
   */
  users: string[];
  /**
   * Users that will be displayed but neither selectable nor removable
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
  inputValue?: string;
  /**
   * Text used for component ID and placeholder text, E.g. "editors".
   */
  title: string;
  /**
   * Called when a user is selected
   */
  onSelect: (value: string[], changedUser?: string) => Promise<void> | void;
  /**
   * Called when a user is removed
   */
  onRemove: (value: string[], changedUser?: string) => Promise<void> | void;
  onInputChange?: (value: string) => void;
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
  inputValue,
  onSelect,
  onRemove,
  onInputChange,
}) => {
  // The directory is only needed to offer someone new, so a list the caller may not change reads
  // the memberships it already holds without asking who else exists.
  const { data, isLoading: isUsersLoading } = useGetUsers({ query: { enabled: !disabled } });
  const availableUsers = data?.users ?? [];

  const loading = (!disabled && isUsersLoading) || isLoading;

  const updateUsers = async (value: string[], reason: AutocompleteChangeReason) => {
    switch (reason) {
      // A name the directory offers and a name that was typed are both a name this list was asked
      // to hold, so committing typed text is a change its owner answers for rather than a keystroke
      // the field drops. The owner decides what an unusable name means; this field never does.
      case "createOption":
      case "selectOption": {
        // The named user is the one an owner acts on directly, so text that spells no name names
        // nobody. The list itself still carries exactly what was committed, for an owner that reads
        // the whole edit and shapes it for itself.
        const added = value.find((user) => !users.includes(user))?.trim();
        await onSelect(value, added === "" ? undefined : added);
        break;
      }
      case "removeOption": {
        const removed = users.find((user) => !value.includes(user));
        // A protected user is displayed but never given up, including through the keyboard shortcut
        // that deletes the last chip without touching its delete icon.
        if (removed !== undefined && disabledUsers.includes(removed)) {
          break;
        }
        await onRemove(value, removed);
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
      inputValue={inputValue}
      loading={loading}
      options={availableUsers.map((user) => user.username)}
      renderInput={(params) => <TextField {...params} helperText={helperText} label={title} />}
      renderValue={(value, getItemProps) =>
        value.map((option: string, index: number) => {
          const { onDelete, ...chipProps } = getItemProps({ index });
          const isProtected = disabledUsers.includes(option);
          return (
            <Chip
              deleteIcon={<CancelIcon aria-label={`Remove ${option}`} />}
              label={option}
              variant="outlined"
              // A protected user offers no way to remove itself, so the list cannot ask for a
              // change the resource does not accept.
              onDelete={isProtected ? undefined : onDelete}
              {...chipProps}
              key={option}
            />
          );
        })
      }
      value={users}
      onChange={(_, value, reason) => void updateUsers(value, reason)}
      onInputChange={(_, value) => onInputChange?.(value)}
    />
  );
};
