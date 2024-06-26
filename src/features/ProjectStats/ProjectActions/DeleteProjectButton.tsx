import { useState } from "react";

import {
  getGetProductsForUnitQueryKey,
  getGetProductsQueryKey,
  useDeleteProduct,
} from "@squonk/account-server-client/product";
import { type DmError, type ProjectDetail } from "@squonk/data-manager-client";
import { getGetProjectsQueryKey, useDeleteProject } from "@squonk/data-manager-client/project";

import { DeleteForever } from "@mui/icons-material";
import { IconButton, LinearProgress, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { WarningDeleteButton } from "../../../components/WarningDeleteButton";
import { useCurrentProjectId } from "../../../hooks/projectHooks";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { waitUntilTaskDone } from "../../../utils/app/waitUntiTaskDone";

export interface DeleteProjectButtonProps {
  /**
   * Project to be edited.
   */
  project: ProjectDetail;
}

/**
 * Button with modal which deletes a provided project.
 */
export const DeleteProjectButton = ({ project }: DeleteProjectButtonProps) => {
  const { projectId: currentProjectId, setCurrentProjectId } = useCurrentProjectId();

  const { user } = useKeycloakUser();
  const isAdmin = user.username && project.administrators.includes(user.username);

  const queryClient = useQueryClient();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();
  const { mutateAsync: deleteProduct } = useDeleteProduct();
  const { mutateAsync: deleteProject } = useDeleteProject();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (project.project_id) {
      try {
        const { task_id } = await deleteProject({ projectId: project.project_id });
        enqueueSnackbar(`Project deletion started (task: ${task_id})`, { variant: "info" });
        setIsDeleting(true);

        await waitUntilTaskDone(task_id);

        setIsDeleting(false);
        enqueueSnackbar(`Project deletion finished (task: ${task_id})`, { variant: "info" });

        project.product_id && (await deleteProduct({ productId: project.product_id }));

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

    void queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
    project.unit_id &&
      void queryClient.invalidateQueries({
        queryKey: getGetProductsForUnitQueryKey(project.unit_id),
      });
  };

  return (
    <WarningDeleteButton
      modalChildren={
        isDeleting ? (
          <>
            <Typography variant="body1">Deletion in progress. Please wait...</Typography>
            <LinearProgress />
          </>
        ) : (
          <>
            <Typography gutterBottom variant="body1">
              You are trying to delete the project <b>{project.name}</b>. This cannot be undone.
            </Typography>
            <Typography variant="body1">
              <em>Please note that this will also delete the associated product.</em>
            </Typography>
          </>
        )
      }
      modalId={`delete-${project.project_id}`}
      title="Delete Project"
      tooltipText="Delete Project"
      onDelete={handleDelete}
    >
      {({ openModal, isDeleting: disabled }) =>
        isAdmin && (
          <IconButton
            disabled={disabled || isDeleting}
            size="small"
            sx={{ p: "1px" }}
            onClick={openModal}
          >
            <DeleteForever />
          </IconButton>
        )
      }
    </WarningDeleteButton>
  );
};
