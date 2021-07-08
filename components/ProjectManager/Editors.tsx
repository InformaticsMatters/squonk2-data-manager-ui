import React, { FC } from 'react';
import { useQueryClient } from 'react-query';

import {
  getGetProjectsQueryKey,
  useAddEditorToProject,
  useGetProjects,
  useRemoveEditorFromProject,
} from '@squonk/data-manager-client/project';
import { useGetUsers } from '@squonk/data-manager-client/user';

import { useUser } from '@auth0/nextjs-auth0';
import { Chip, TextField } from '@material-ui/core';
import { Autocomplete, AutocompleteChangeReason } from '@material-ui/lab';

import { useCurrentProject } from '../currentProjectHooks';

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
      disableClearable
      freeSolo
      fullWidth
      multiple
      getOptionDisabled={(option) => option === currentUser.preferred_username}
      id="editors"
      loading={isLoading || isProjectsLoading}
      options={availableUsers.map((user) => user.username)}
      renderInput={(params) => <TextField {...params} label="Editors" />}
      renderTags={(value, getTagProps) =>
        value.map((option: string, index: number) => {
          const { onDelete, ...chipProps } = getTagProps({ index }) as any;
          return (
            <Chip
              key={option}
              label={option}
              variant="outlined"
              onDelete={option !== currentUser.preferred_username ? onDelete : undefined}
              {...chipProps}
            />
          );
        })
      }
      value={[
        currentUser.preferred_username as string,
        ...currentProject.editors.filter((user) => user !== currentUser.preferred_username),
      ]}
      onChange={(_, value, reason) => updateEditors(value, reason)}
    />
  ) : null;
};
