import { useQueryClient } from 'react-query';

import type { ProductDmProjectTier } from '@squonk/account-server-client';
import {
  getGetProductQueryKey,
  getGetProductsForUnitQueryKey,
} from '@squonk/account-server-client/product';
import type { DmError, ProjectDetail } from '@squonk/data-manager-client';
import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  useAddEditorToProject,
  useRemoveEditorFromProject,
} from '@squonk/data-manager-client/project';
import { useGetUsers } from '@squonk/data-manager-client/user';

import { Chip, TextField } from '@material-ui/core';
import type { AutocompleteChangeReason } from '@material-ui/lab';
import { Autocomplete } from '@material-ui/lab';

import { useEnqueueError } from '../../../../../../hooks/useEnqueueStackError';
import { useKeycloakUser } from '../../../../../../hooks/useKeycloakUser';

export interface ProjectEditorsProps {
  /**
   * Project to be edited.
   */
  project: ProjectDetail;
  /**
   * Project product details.
   */
  projectProduct: ProductDmProjectTier;
}

/**
 * MuiAutocomplete to manage the current editors of the selected project
 */
export const ProjectEditors = ({ project, projectProduct }: ProjectEditorsProps) => {
  const { user: currentUser } = useKeycloakUser();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const { data, isLoading } = useGetUsers();
  const availableUsers = data?.users;

  const { mutateAsync: addEditor } = useAddEditorToProject();
  const { mutateAsync: removeEditor } = useRemoveEditorFromProject();
  const queryClient = useQueryClient();

  const updateEditors = async (value: string[], reason: AutocompleteChangeReason) => {
    switch (reason) {
      case 'select-option': {
        // Isolate the user that has been added
        const username = value.find((user) => !project.editors.includes(user));
        if (username) {
          try {
            await addEditor({
              projectid: project.project_id,
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
        const username = project.editors.find((editor) => !value.includes(editor));
        if (username) {
          try {
            await removeEditor({
              projectid: project.project_id,
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

    // DM Queries
    queryClient.invalidateQueries(getGetProjectQueryKey(project.project_id));
    queryClient.invalidateQueries(getGetProjectsQueryKey());

    // AS queries
    queryClient.invalidateQueries(getGetProductsForUnitQueryKey(projectProduct.unit.id));
    queryClient.invalidateQueries(
      getGetProductQueryKey(projectProduct.unit.id, projectProduct.product.id),
    );
  };

  return !!availableUsers && !!currentUser.username ? (
    <Autocomplete
      disableClearable
      freeSolo
      fullWidth
      multiple
      getOptionDisabled={(option) => option === currentUser.username} // Can't remove oneself
      id="editors"
      loading={isLoading}
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
        ...project.editors.filter((user) => user !== currentUser.username),
      ]}
      onChange={(_, value, reason) => updateEditors(value, reason)}
    />
  ) : null;
};
