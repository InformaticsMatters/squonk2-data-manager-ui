import type { ProductDmProjectTier } from "@squonk/account-server-client";
import { useGetProjects } from "@squonk/data-manager-client/project";

import { Box, CircularProgress } from "@mui/material";

import { EditProjectButton } from "../../../components/projects/EditProjectButton";
import { OpenProjectButton } from "../../../components/projects/OpenProjectButton";
import { DeleteProjectButton } from "./DeleteProjectButton";

export interface ProjectActionsProps {
  /**
   * Project product details.
   */
  projectProduct: ProductDmProjectTier;
}

/**
 * Table cell with edit and delete actions for provided project product.
 */
export const ProjectActions = ({ projectProduct }: ProjectActionsProps) => {
  const { data, isLoading } = useGetProjects();
  const project = data?.projects.find(
    (project) => project.product_id === projectProduct.product.id,
  );

  if (isLoading) {
    return <CircularProgress size="1rem" />;
  }

  return project ? (
    <Box display="flex">
      <OpenProjectButton projectId={project.project_id} />
      <EditProjectButton project={project} />
      <DeleteProjectButton project={project} />
    </Box>
  ) : null;
};
