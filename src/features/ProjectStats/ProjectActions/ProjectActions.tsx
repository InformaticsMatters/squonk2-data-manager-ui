import { useGetProject } from "@squonk/data-manager-client/project";

import { Edit as EditIcon } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";

import { ChargesLinkIconButton } from "../../../components/products/ChargesLinkIconButton";
import { EditProjectButton } from "../../../components/projects/EditProjectButton";
import { OpenProjectButton } from "../../../components/projects/OpenProjectButton";
import { type ProjectId } from "../../../hooks/projectHooks";
import { DeleteProjectButton } from "./DeleteProjectButton";

export interface ProjectActionsProps {
  projectId: NonNullable<ProjectId>;
  isCreator: boolean;
  isAdministrator: boolean;
  isEditor: boolean;
}

/**
 * Table cell with edit and delete actions for provided project product.
 */
export const ProjectActions = ({
  projectId,
  isCreator,
  isAdministrator,
  isEditor,
}: ProjectActionsProps) => {
  const { data: project, isLoading } = useGetProject(projectId);

  if (isLoading) {
    return <CircularProgress size="1rem" />;
  }

  return project ? (
    <Box display="flex">
      <OpenProjectButton projectId={projectId} />
      {!!(isEditor || isAdministrator) && (
        <EditProjectButton projectId={project.project_id}>
          {({ openDialog }) => {
            return (
              <Tooltip title="Edit Project">
                <span>
                  <IconButton size="small" sx={{ p: "1px" }} onClick={openDialog}>
                    <EditIcon />
                  </IconButton>
                </span>
              </Tooltip>
            );
          }}
        </EditProjectButton>
      )}
      {!!isCreator && <DeleteProjectButton project={project} />}
      {!!(isEditor || isAdministrator) && <ChargesLinkIconButton productId={project.product_id} />}
    </Box>
  ) : null;
};
