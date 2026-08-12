import { useGetProject } from "@/api/data-manager/project";

import { Settings as ManageIcon } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import Link from "next/link";

import { ChargesLinkIconButton } from "../../../components/products/ChargesLinkIconButton";
import { OpenProjectButton } from "../../../components/projects/OpenProjectButton";
import { type ProjectId } from "../../../hooks/projectHooks";
import { projectLinks } from "../../../projects/routes";

export interface ProjectActionsProps {
  projectId: NonNullable<ProjectId>;
  isAdministrator: boolean;
  isEditor: boolean;
}

/**
 * Table cell linking to the routes that own the provided project product.
 */
export const ProjectActions = ({
  projectId,
  isAdministrator: isProjectAdministrator,
  isEditor,
}: ProjectActionsProps) => {
  const { data: project, isLoading } = useGetProject(projectId);

  if (isLoading) {
    return <CircularProgress size="1rem" />;
  }

  return project ? (
    <Box sx={{ display: "flex" }}>
      <OpenProjectButton projectId={projectId} />
      {/* Project privacy, membership, and deletion belong to the project's own Manage route, so
          this report links there rather than owning a second way to reach them. Manage is readable
          by every project viewer and explains what it cannot offer, so the link is not gated on
          authority. */}
      <Tooltip title="Manage project">
        <IconButton
          component={Link}
          href={projectLinks.manage(project.project_id) as never}
          size="small"
          sx={{ p: "1px" }}
        >
          <ManageIcon />
        </IconButton>
      </Tooltip>
      {!!(isEditor || isProjectAdministrator) && (
        <ChargesLinkIconButton productId={project.product_id} />
      )}
    </Box>
  ) : null;
};
