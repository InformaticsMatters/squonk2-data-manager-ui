import { List } from "@mui/material";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { BrowserViewerListItem } from "./BrowserViewerListItem";
import { FilePlainTextViewerListItem } from "./FilePlainTextViewerListItem";

export interface FileViewersListProps {
  fileName: string;
  path?: string;
  onClick: () => void;
}

export const FileViewersList = ({ fileName, path, onClick }: FileViewersListProps) => {
  const { projectId } = useCurrentProjectId();

  return (
    <List>
      <FilePlainTextViewerListItem fileName={fileName} path={path} onClick={onClick} />
      {projectId && (
        <BrowserViewerListItem
          fileName={fileName}
          path={path}
          projectId={projectId}
          onClick={onClick}
        />
      )}
    </List>
  );
};
