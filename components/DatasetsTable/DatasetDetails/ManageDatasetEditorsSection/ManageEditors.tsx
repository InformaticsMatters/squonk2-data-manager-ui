import type { FC } from 'react';
import React from 'react';

import { useGetUsers } from '@squonk/data-manager-client/user';

import { Chip, TextField } from '@material-ui/core';
import type { AutocompleteChangeReason } from '@material-ui/lab';
import { Autocomplete } from '@material-ui/lab';

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
      case 'select-option': {
        // Isolate the user that has been added
        await onSelect(value);
        break;
      }
      case 'remove-option': {
        // Isolate the user that has been removed
        await onRemove(value);
        break;
      }
    }
  };

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
          const { onDelete, ...chipProps } = getTagProps({ index }) as any; // TODO: find better typing
          return (
            <Chip
              key={option}
              label={option}
              variant="outlined"
              onDelete={option !== currentUsername ? onDelete : undefined}
              {...chipProps}
            />
          );
        })
      }
      value={[currentUsername, ...editorsValue]}
      onChange={(_, value, reason) => updateEditors(value, reason)}
    />
  ) : null;
};
