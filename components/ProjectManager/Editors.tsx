import React, { FC } from 'react';

import { useQueryClient } from 'react-query';

import { useUser } from '@auth0/nextjs-auth0';
import { Chip, TextField } from '@material-ui/core';
import { Autocomplete, AutocompleteChangeReason } from '@material-ui/lab';
import {
  getGetProjectsQueryKey,
  useAddEditorToProject,
  useGetProjects,
  useRemoveEditorFromProject,
} from '@squonk/data-manager-client/project';
import { useGetUsers } from '@squonk/data-manager-client/user';

import { useCurrentProject } from '../CurrentProjectContext';

export const Editors: FC = () => {
  const { user: currentUser } = useUser();

  const currentProject = useCurrentProject();
  const { isLoading: isProjectsLoading } = useGetProjects();

  const { data, isLoading } = useGetUsers();
  const availableUsers = data?.users;
  const addEditor = useAddEditorToProject();
  const removeEditor = useRemoveEditorFromProject();
  const queryClient = useQueryClient();

  const updateEditors = async (value: string[], reason: AutocompleteChangeReason) => {
    if (currentProject !== null) {
      switch (reason) {
        case 'select-option': {
          // Isolate the user that has been added
          const username = value.find((user) => !currentProject.editors.includes(user));
          username &&
            (await addEditor.mutateAsync({
              projectid: currentProject.project_id,
              userid: username,
            }));
          break;
        }
        case 'remove-option': {
          // Isolate the user that has been removed
          const username = currentProject.editors.find((editor) => !value.includes(editor));
          username &&
            (await removeEditor.mutateAsync({
              projectid: currentProject.project_id,
              userid: username,
            }));
          break;
        }
      }
      // Invalidate GET projects as that is where currentProject is sourced from
      queryClient.invalidateQueries(getGetProjectsQueryKey());
    }
  };

  return !!currentProject && !!availableUsers && !!currentUser ? (
    <Autocomplete
      options={availableUsers.map((user) => user.username)}
      disableClearable
      loading={isLoading || isProjectsLoading}
      getOptionDisabled={(option) => option === currentUser.preferred_username}
      fullWidth
      multiple
      id="editors"
      value={[
        currentUser.preferred_username as string,
        ...currentProject.editors.filter((user) => user !== currentUser.preferred_username),
      ]}
      freeSolo
      renderTags={(value, getTagProps) =>
        value.map((option: string, index: number) => {
          const { onDelete, ...chipProps } = getTagProps({ index }) as any;
          return (
            <Chip
              key={option}
              variant="outlined"
              label={option}
              onDelete={option !== currentUser.preferred_username ? onDelete : undefined}
              {...chipProps}
            />
          );
        })
      }
      onChange={(_, value, reason) => updateEditors(value, reason)}
      renderInput={(params) => <TextField {...params} label="Editors" />}
    />
  ) : null;
};
