import { useGetProject } from "@squonk/data-manager-client/project";

import { Box, CircularProgress } from "@mui/material";

import { ChargesLinkIconButton } from "../../../components/products/ChargesLinkIconButton";
import { EditProjectButton } from "../../../components/projects/EditProjectButton";
import { OpenProjectButton } from "../../../components/projects/OpenProjectButton";
import type { ProjectId } from "../../../hooks/projectHooks";
import { DeleteProjectButton } from "./DeleteProjectButton";

export interface ProjectActionsProps {
  projectId: NonNullable<ProjectId>;
  isAdministrator: boolean;
  isEditor: boolean;
}

/**
 * Table cell with edit and delete actions for provided project product.
 */
export const ProjectActions = ({ projectId, isAdministrator, isEditor }: ProjectActionsProps) => {
  const { data: project, isLoading } = useGetProject(projectId);

  if (isLoading) {
    return <CircularProgress size="1rem" />;
  }

  return project ? (
    <Box display="flex">
      <OpenProjectButton projectId={projectId} />
      {(isEditor || isAdministrator) && <EditProjectButton project={project} />}
      {(isEditor || isAdministrator) && <DeleteProjectButton project={project} />}
      {(isEditor || isAdministrator) && <ChargesLinkIconButton productId={project.product_id} />}
    </Box>
  ) : null;
};
