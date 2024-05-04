import { Description as DescriptionIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import A from "next/link";
import { useRouter } from "next/router";

import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";

export interface FilePlainTextViewerListItemProps {
  fileName: string;
  path?: string;
  onClick: () => void;
}

export const FilePlainTextViewerListItem = ({
  fileName,
  path,
  onClick,
}: FilePlainTextViewerListItemProps) => {
  const router = useRouter();

  const breadcrumbs = useProjectBreadcrumbs();
  path === undefined && (path = breadcrumbs.join("/"));

  return (
    <A
      legacyBehavior
      passHref
      href={{
        pathname: "/project/file",
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
        <ListItemText primary="Plaintext Viewer" secondary="Displays the file as plaintext" />
        <ListItemIcon sx={{ ml: 2 }}>
          <DescriptionIcon color="action" />
        </ListItemIcon>
      </ListItemButton>
    </A>
  );
};
