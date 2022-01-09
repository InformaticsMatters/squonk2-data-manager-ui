import { useQueryClient } from 'react-query';

import type { DmError } from '@squonk/data-manager-client';
import {
  getGetProjectsQueryKey,
  useAddEditorToProject,
  useGetProjects,
  useRemoveEditorFromProject,
} from '@squonk/data-manager-client/project';
import { useGetUsers } from '@squonk/data-manager-client/user';

import { Chip, TextField } from '@material-ui/core';
import type { AutocompleteChangeReason } from '@material-ui/lab';
import { Autocomplete } from '@material-ui/lab';

import { useCurrentProject } from '../../hooks/currentProjectHooks';
import { useEnqueueError } from '../../hooks/useEnqueueStackError';
import { useKeycloakUser } from '../../hooks/useKeycloakUser';

/**
 * MuiAutocomplete to manage the current editors of the selected project
 */
export const Editors = () => {
  const { user: currentUser } = useKeycloakUser();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const currentProject = useCurrentProject();
  const { isLoading: isProjectsLoading } = useGetProjects();

  const { data, isLoading } = useGetUsers();
  const availableUsers = data?.users;

  const { mutateAsync: addEditor } = useAddEditorToProject();
  const { mutateAsync: removeEditor } = useRemoveEditorFromProject();
  const queryClient = useQueryClient();

  const updateEditors = async (value: string[], reason: AutocompleteChangeReason) => {
    if (currentProject !== null) {
      switch (reason) {
        case 'select-option': {
          // Isolate the user that has been added
          const username = value.find((user) => !currentProject.editors.includes(user));
          if (username) {
            try {
              await addEditor({
                projectid: currentProject.project_id,
                userid: username,
              });
            } catch (error) {
              enqueueError(error);
            }
          } else {
            enqueueSnackbar('Username not found', { variant: 'warning' });
          }
          break;
        }

        case 'remove-option': {
          // Isolate the user that has been removed
          const username = currentProject.editors.find((editor) => !value.includes(editor));
          if (username) {
            try {
              await removeEditor({
                projectid: currentProject.project_id,
                userid: username,
              });
            } catch (error) {
              enqueueError(error);
            }
          } else {
            enqueueSnackbar('Username not found', { variant: 'warning' });
          }
          break;
        }
      }
      // Invalidate GET projects as that is where currentProject is sourced from
      queryClient.invalidateQueries(getGetProjectsQueryKey());
    }
  };

  return !!currentProject && !!availableUsers && !!currentUser.username ? (
    <Autocomplete
      disableClearable
      freeSolo
      fullWidth
      multiple
      getOptionDisabled={(option) => option === currentUser.username} // Can't remove oneself
      id="editors"
      loading={isLoading || isProjectsLoading}
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
              onDelete={option !== currentUser.username ? onDelete : undefined}
              {...chipProps}
            />
          );
        })
      }
      value={[
        // Place current user at the beginning
        currentUser.username,
        ...currentProject.editors.filter((user) => user !== currentUser.username),
      ]}
      onChange={(_, value, reason) => updateEditors(value, reason)}
    />
  ) : null;
};
