import { Description } from "@mui/icons-material";
import { List, ListItem, ListItemText } from "@mui/material";

import { API_ROUTES } from "../../../../constants/routes";
import { useCurrentProjectId } from "../../../../hooks/projectHooks";
import { useProjectBreadcrumbs } from "../../../../hooks/projectPathHooks";
import type { TableFile } from "../../types";
import { FilePlainTextViewerListItem } from "./FilePlainTextViewerListItem";

export interface ProjectViewSectionProps {
  file: TableFile;
}

export const ProjectViewSection = ({ file }: ProjectViewSectionProps) => {
  const { projectId } = useCurrentProjectId();
  const breadcrumbs = useProjectBreadcrumbs();
  const path = "/" + breadcrumbs.join("/");
  return (
    <List>
      <FilePlainTextViewerListItem fileName={file.fileName} />
      {projectId && (
        <ListItem
          button
          component="a"
          href={
            process.env.NEXT_PUBLIC_BASE_PATH +
            API_ROUTES.projectFile(projectId, path, file.fileName, true)
          }
          rel="noopener noreferrer"
          target="_blank"
        >
          <ListItemText
            primary="Browser Viewer"
            secondary="Displays the file in your browser if it supports the file type, otherwise downloads the file"
          />
          <Description color="action" />
        </ListItem>
      )}
    </List>
  );
};
