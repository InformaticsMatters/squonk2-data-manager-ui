import { useState } from "react";
import { useQueryClient } from "react-query";

import {
  getGetProductsForUnitQueryKey,
  getGetProductsQueryKey,
  useDeleteProduct,
} from "@squonk/account-server-client/product";
import type { DmError, ProjectDetail } from "@squonk/data-manager-client";
import { getGetProjectsQueryKey, useDeleteProject } from "@squonk/data-manager-client/project";

import { DeleteForever } from "@mui/icons-material";
import { IconButton, LinearProgress, Typography } from "@mui/material";

import { useCurrentProjectId } from "../../../../../hooks/projectHooks";
import { useEnqueueError } from "../../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../../hooks/useKeycloakUser";
import { waitUntilTaskDone } from "../../../../../utils/waitUntiTaskDone";
import { WarningDeleteButton } from "../../../../WarningDeleteButton";

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
  const isOwner = user.username === project.owner;

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

    queryClient.invalidateQueries(getGetProjectsQueryKey());
    queryClient.invalidateQueries(getGetProductsQueryKey());
    project.unit_id &&
      queryClient.invalidateQueries(getGetProductsForUnitQueryKey(project.unit_id));
  };

  return (
    <WarningDeleteButton
      modalChildren={
        <>
          <Typography variant="body1">
            Are you sure? <b>This cannot be undone</b>.
          </Typography>
          {isDeleting && <LinearProgress />}
        </>
      }
      modalId={`delete-${project.project_id}`}
      title="Delete Project"
      tooltipText={"Delete Project"}
      onDelete={handleDelete}
    >
      {({ openModal, isDeleting: disabled }) =>
        isOwner && (
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
