import type { ProductDetail } from "@squonk/account-server-client";
import { useGetProjects } from "@squonk/data-manager-client/project";

import { Box, CircularProgress } from "@mui/material";

import { ChargesLinkIconButton } from "../../../components/products/ChargesLinkIconButton";
import { EditProjectButton } from "../../../components/projects/EditProjectButton";
import { OpenProjectButton } from "../../../components/projects/OpenProjectButton";
import { DeleteProjectButton } from "./DeleteProjectButton";

export interface ProjectActionsProps {
  productId: ProductDetail["id"];
}

/**
 * Table cell with edit and delete actions for provided project product.
 */
export const ProjectActions = ({ productId }: ProjectActionsProps) => {
  const { data, isLoading } = useGetProjects();
  const project = data?.projects.find((project) => project.product_id === productId);

  if (isLoading) {
    return <CircularProgress size="1rem" />;
  }

  return project ? (
    <Box display="flex">
      <OpenProjectButton projectId={project.project_id} />
      <EditProjectButton project={project} />
      <DeleteProjectButton project={project} />
      <ChargesLinkIconButton productId={project.product_id} />
    </Box>
  ) : null;
};
