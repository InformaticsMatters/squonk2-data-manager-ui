import { Biotech as BiotechIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import A from "next/link";
import { useRouter } from "next/router";

import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";

export interface SDFViewerListItemProps {
  fileName: string;
  path?: string;
  onClick: () => void;
}

export const SDFViewerListItem = ({ fileName, path, onClick }: SDFViewerListItemProps) => {
  const router = useRouter();

  const breadcrumbs = useProjectBreadcrumbs();
  path ??= breadcrumbs.join("/");

  return (
    <ListItemButton
      component={A}
      href={{
        pathname: "/viewer/sdf",
        query: { project: router.query.project, file: fileName, path },
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
};
