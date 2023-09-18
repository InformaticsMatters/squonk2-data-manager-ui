import { Description as DescriptionIcon } from "@mui/icons-material";
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
  path === undefined && (path = breadcrumbs.join("/"));

  return (
    <A
      legacyBehavior
      passHref
      href={{
        pathname: "/viewer/sdf",
        query: {
          project: router.query.project,
          file: fileName,
          path,
        },
      }}
    >
      <ListItemButton
        component="a"
        rel="noopener noreferrer"
        target="_blank"
        onClick={() => onClick()}
      >
        <ListItemText
          primary="SDF Viewer"
          secondary="Displays the records in a card view with a scatter plot to filter those displayed."
        />
        <ListItemIcon sx={{ ml: 2 }}>
          <DescriptionIcon color="action" />
        </ListItemIcon>
      </ListItemButton>
    </A>
  );
};
