import { useQueryClient } from 'react-query';

import type { ProductDmProjectTier } from '@squonk/account-server-client';
import { getGetProductsForUnitQueryKey } from '@squonk/account-server-client/product';
import type { DmError, ProjectDetail } from '@squonk/data-manager-client';
import { getGetProjectsQueryKey, useDeleteProject } from '@squonk/data-manager-client/project';
import { getGetUserAccountQueryKey } from '@squonk/data-manager-client/user';

import { IconButton } from '@material-ui/core';
import { DeleteForever } from '@material-ui/icons';

import { useCurrentProjectId } from '../../../../../hooks/projectHooks';
import { useEnqueueError } from '../../../../../hooks/useEnqueueStackError';
import { useKeycloakUser } from '../../../../../hooks/useKeycloakUser';
import { WarningDeleteButton } from '../../../../WarningDeleteButton';

export interface DeleteProjectButtonProps {
  project: ProjectDetail;
  projectProduct: ProductDmProjectTier;
}

export const DeleteProjectButton = ({ project, projectProduct }: DeleteProjectButtonProps) => {
  const { projectId: currentProjectId, setCurrentProjectId } = useCurrentProjectId();

  const { user } = useKeycloakUser();
  const isOwner = user.username === project.owner;

  const queryClient = useQueryClient();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();
  const { mutateAsync: deleteProject } = useDeleteProject();

  const handleDelete = async () => {
    if (project.project_id) {
      try {
        const { task_id } = await deleteProject({ projectid: project.project_id });
        enqueueSnackbar(`Project deletion started (task: ${task_id})`, { variant: 'info' });

        // If the project is currently selected, unselect it
        if (project.project_id === currentProjectId) {
          setCurrentProjectId();
        }
      } catch (error) {
        enqueueError(error);
      }
    } else {
      enqueueSnackbar('Project not found', { variant: 'warning' });
    }
    queryClient.invalidateQueries(getGetProjectsQueryKey());
    queryClient.invalidateQueries(getGetUserAccountQueryKey());
    queryClient.invalidateQueries(getGetProductsForUnitQueryKey(projectProduct.unit.id));
  };

  return (
    <WarningDeleteButton
      modalId={`delete-${project.project_id}`}
      title="Delete Project"
      tooltipText={isOwner ? 'Delete Project' : 'Select a project of which you have ownership'}
      onDelete={handleDelete}
    >
      {({ openModal }) => (
        <IconButton disabled={!isOwner} size="small" onClick={openModal}>
          <DeleteForever />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
