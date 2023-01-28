import { List } from "@mui/material";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { BrowserViewerListItem } from "./BrowserViewerListItem";
import { FilePlainTextViewerListItem } from "./FilePlainTextViewerListItem";

export interface FileViewersListProps {
  fileName: string;
  path?: string;
}

export const FileViewersList = ({ fileName, path }: FileViewersListProps) => {
  const { projectId } = useCurrentProjectId();

  return (
    <List>
      <FilePlainTextViewerListItem fileName={fileName} path={path} />
      {projectId && <BrowserViewerListItem fileName={fileName} path={path} projectId={projectId} />}
    </List>
  );
};
