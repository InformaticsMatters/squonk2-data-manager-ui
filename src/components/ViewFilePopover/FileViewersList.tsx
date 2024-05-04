import { List } from "@mui/material";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { BrowserViewerListItem } from "./BrowserViewerListItem";
import { FilePlainTextViewerListItem } from "./FilePlainTextViewerListItem";
import { SDFViewerListItem } from "./SDFViewerListItem";

export interface FileViewersListProps {
  fileName: string;
  path?: string;
  onClick: () => void;
}

export const FileViewersList = ({ fileName, path, onClick }: FileViewersListProps) => {
  const { projectId } = useCurrentProjectId();

  return (
    <List sx={{ maxWidth: "600px" }}>
      <FilePlainTextViewerListItem fileName={fileName} path={path} onClick={onClick} />
      {!!projectId && (
        <BrowserViewerListItem
          fileName={fileName}
          path={path}
          projectId={projectId}
          onClick={onClick}
        />
      )}
      {(fileName.endsWith(".sdf") || fileName.endsWith(".sdf.gz")) && (
        <SDFViewerListItem fileName={fileName} path={path} onClick={onClick} />
      )}
    </List>
  );
};
