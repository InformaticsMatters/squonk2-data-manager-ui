import { Description as DescriptionIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

import type { ProjectId } from "../../hooks/projectHooks";
import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";
import { API_ROUTES } from "../../utils/app/routes";

export interface BrowserViewerListItemProps {
  fileName: string;
  path?: string;
  projectId: NonNullable<ProjectId>;
}

export const BrowserViewerListItem = ({
  fileName,
  projectId,
  path,
}: BrowserViewerListItemProps) => {
  const breadcrumbs = useProjectBreadcrumbs();
  path === undefined && (path = "/" + breadcrumbs.join("/"));

  return (
    <ListItemButton
      component="a"
      href={
        (process.env.NEXT_PUBLIC_BASE_PATH ?? "") +
        API_ROUTES.projectFile(projectId, path, fileName, "/api/viewer-proxy")
      }
      rel="noopener noreferrer"
      target="_blank"
    >
      <ListItemText
        primary="Browser Viewer"
        secondary="Displays the file in your browser if it supports the file type"
      />
      <ListItemIcon sx={{ ml: 2 }}>
        <DescriptionIcon color="action" />
      </ListItemIcon>
    </ListItemButton>
  );
};
