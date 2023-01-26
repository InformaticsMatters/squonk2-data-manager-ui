import type { FC } from "react";

import { useGetUsers } from "@squonk/data-manager-client/user";

import { Autocomplete, Chip, TextField } from "@mui/material";
import type { AutocompleteChangeReason } from "@mui/material/useAutocomplete";

export interface ManageEditorsProps {
  /**
   * User's email
   */
  currentUsername: string;
  /**
   * Array of current editors
   */
  editorsValue: string[];
  /**
   * Whether the component should be in a loading state
   */
  isLoading?: boolean;
  /**
   * Called when a editor is selected
   */
  onSelect: (value: string[]) => Promise<void> | void;
  /**
   * Called when an editor is removed
   */
  onRemove: (value: string[]) => Promise<void> | void;
}

/**
 * MuiAutocomplete to manage the editors of a dataset
 */
export const ManageEditors: FC<ManageEditorsProps> = ({
  currentUsername,
  editorsValue,
  isLoading = false,
  onSelect,
  onRemove,
}) => {
  const { data, isLoading: isUsersLoading } = useGetUsers();
  const availableUsers = data?.users;

  const loading = isUsersLoading || isLoading;

  const updateEditors = async (value: string[], reason: AutocompleteChangeReason) => {
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

  console.log(availableUsers);

  return availableUsers ? (
    <Autocomplete
      disableClearable
      freeSolo
      fullWidth
      multiple
      disabled={loading}
      getOptionDisabled={(option) => option === currentUsername}
      id="editors"
      loading={loading}
      options={availableUsers.map((user) => user.username)}
      renderInput={(params) => <TextField {...params} label="Editors" />}
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
      value={[currentUsername, ...editorsValue]}
      onChange={(_, value, reason) => updateEditors(value, reason)}
    />
  ) : null;
};
