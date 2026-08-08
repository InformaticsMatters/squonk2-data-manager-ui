import { Description as DescriptionIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

import { withBasePath } from "../../utils/app/basePath";
import { API_ROUTES } from "../../utils/app/routes";

export interface BrowserViewerListItemProps {
  fileName: string;
  /** Absolute path of the directory holding the file, inside the project that owns it. */
  path: string;
  projectId: string;
  onClick: () => void;
}

export const BrowserViewerListItem = ({
  fileName,
  path,
  projectId,
  onClick,
}: BrowserViewerListItemProps) => (
  <ListItemButton
    component="a"
    href={withBasePath(API_ROUTES.projectFile(projectId, path, fileName, "/api/viewer-proxy"))}
    rel="noopener noreferrer"
    target="_blank"
    onClick={() => onClick()}
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
