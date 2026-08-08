import { Biotech as BiotechIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import A from "next/link";

import { legacyViewerPath } from "./legacyViewerPath";

export interface SDFViewerListItemProps {
  fileName: string;
  /** Absolute path of the directory holding the file, inside the project that owns it. */
  path: string;
  projectId: string;
  onClick: () => void;
}

export const SDFViewerListItem = ({
  fileName,
  path,
  projectId,
  onClick,
}: SDFViewerListItemProps) => (
  <ListItemButton
    component={A}
    href={{
      pathname: "/viewer/sdf",
      query: { file: fileName, path: legacyViewerPath(path), project: projectId },
    }}
    rel="noopener noreferrer"
    target="_blank"
    onClick={() => onClick()}
  >
    <ListItemText
      primary="SDF Viewer (alpha)"
      secondary="Displays SDF records as molecule cards containing the structure and properties,
        filterable with a scatter plot selector. This feature is under activate development and
        may not work as expected. Please provide us feedback."
    />
    <ListItemIcon sx={{ ml: 2 }}>
      <BiotechIcon color="action" />
    </ListItemIcon>
  </ListItemButton>
);
