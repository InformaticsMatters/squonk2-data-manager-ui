import { useQueryClient } from "react-query";

import type { ProductDmProjectTier } from "@squonk/account-server-client";
import {
  getGetProductQueryKey,
  getGetProductsForUnitQueryKey,
} from "@squonk/account-server-client/product";
import type { DmError, ProjectDetail } from "@squonk/data-manager-client";
import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  useDeleteProject,
} from "@squonk/data-manager-client/project";
import { getGetUserAccountQueryKey } from "@squonk/data-manager-client/user";

import { DeleteForever } from "@mui/icons-material";
import { IconButton } from "@mui/material";

import { useCurrentProjectId } from "../../../../../hooks/projectHooks";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { WarningDeleteButton } from "../../../../WarningDeleteButton";

export interface DeleteProjectButtonProps {
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
 * Button with modal which deletes a provided project.
 */
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
        const { task_id } = await deleteProject({ projectId: project.project_id });
        enqueueSnackbar(`Project deletion started (task: ${task_id})`, { variant: "info" });

        // If the project is currently selected, unselect it
        if (project.project_id === currentProjectId) {
          setCurrentProjectId();
        }
      } catch (error) {
        enqueueError(error);
      }
    } else {
      enqueueSnackbar("Project not found", { variant: "warning" });
    }
    // DM queries
    queryClient.invalidateQueries(getGetProjectQueryKey(project.project_id));
    queryClient.invalidateQueries(getGetProjectsQueryKey());
    queryClient.invalidateQueries(getGetUserAccountQueryKey());

    // AS queries
    queryClient.invalidateQueries(getGetProductsForUnitQueryKey(projectProduct.unit.id));
    queryClient.invalidateQueries(getGetProductQueryKey(projectProduct.product.id));
  };

  return (
    <WarningDeleteButton
      modalId={`delete-${project.project_id}`}
      title="Delete Project"
      tooltipText={"Delete Project"}
      onDelete={handleDelete}
    >
      {({ openModal }) =>
        isOwner && (
          <IconButton size="small" sx={{ p: "1px" }} onClick={openModal}>
            <DeleteForever />
          </IconButton>
        )
      }
    </WarningDeleteButton>
  );
};
