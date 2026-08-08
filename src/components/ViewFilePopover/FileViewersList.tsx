import { List } from "@mui/material";

import { BrowserViewerListItem } from "./BrowserViewerListItem";
import { FilePlainTextViewerListItem } from "./FilePlainTextViewerListItem";
import { SDFViewerListItem } from "./SDFViewerListItem";

export interface FileViewersListProps {
  fileName: string;
  /** Absolute path of the directory holding the file, inside the project that owns it. */
  path: string;
  projectId: string;
  onClick: () => void;
}

export const FileViewersList = ({ fileName, path, projectId, onClick }: FileViewersListProps) => (
  <List sx={{ maxWidth: "600px" }}>
    <FilePlainTextViewerListItem
      fileName={fileName}
      path={path}
      projectId={projectId}
      onClick={onClick}
    />
    <BrowserViewerListItem
      fileName={fileName}
      path={path}
      projectId={projectId}
      onClick={onClick}
    />
    {(fileName.endsWith(".sdf") || fileName.endsWith(".sdf.gz")) && (
      <SDFViewerListItem fileName={fileName} path={path} projectId={projectId} onClick={onClick} />
    )}
  </List>
);
