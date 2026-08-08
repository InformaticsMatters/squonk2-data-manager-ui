import { Description as DescriptionIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import A from "next/link";

import { legacyViewerPath } from "./legacyViewerPath";

export interface FilePlainTextViewerListItemProps {
  fileName: string;
  /** Absolute path of the directory holding the file, inside the project that owns it. */
  path: string;
  projectId: string;
  onClick: () => void;
}

export const FilePlainTextViewerListItem = ({
  fileName,
  path,
  projectId,
  onClick,
}: FilePlainTextViewerListItemProps) => (
  <ListItemButton
    component={A}
    href={{
      pathname: "/project/file",
      query: { file: fileName, path: legacyViewerPath(path), project: projectId },
    }}
    rel="noopener noreferrer"
    target="_blank"
    onClick={() => onClick()}
  >
    <ListItemText primary="Plaintext Viewer" secondary="Displays the file as plaintext" />
    <ListItemIcon sx={{ ml: 2 }}>
      <DescriptionIcon color="action" />
    </ListItemIcon>
  </ListItemButton>
);
