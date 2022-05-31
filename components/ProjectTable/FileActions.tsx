import { API_ROUTES } from "constants/routes";

import { CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";
import type { DownloadButtonProps } from "../DownloadButton";
import type { CreateDatasetFromFileButtonProps } from "./buttons/CreateDatasetFromFileButton";
import type { DeleteUnmanagedFileButtonProps } from "./buttons/DeleteUnmanagedFileButton";
import type { DetachDatasetProps } from "./buttons/DetachDataset";
import { FavouriteButton } from "./buttons/FavouriteButton";
import type { TableDir, TableFile } from "./types";
import { isTableDir } from "./utils";

const DownloadButton = dynamic<DownloadButtonProps>(
  () => import("../DownloadButton").then((mod) => mod.DownloadButton),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);
const DetachDataset = dynamic<DetachDatasetProps>(
  () => import("./buttons/DetachDataset").then((mod) => mod.DetachDataset),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);
const DeleteUnmanagedFileButton = dynamic<DeleteUnmanagedFileButtonProps>(
  () => import("./buttons/DeleteUnmanagedFileButton").then((mod) => mod.DeleteUnmanagedFileButton),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);
const CreateDatasetFromFileButton = dynamic<CreateDatasetFromFileButtonProps>(
  () =>
    import("./buttons/CreateDatasetFromFileButton").then((mod) => mod.CreateDatasetFromFileButton),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

export interface FileActionsProps {
  /**
   * File the actions act on
   */
  file: TableFile | TableDir;
}

/**
 * Actions the user can execute on a given file
 */
export const FileActions = ({ file }: FileActionsProps) => {
  const { projectId } = useCurrentProjectId();

  const breadcrumbs = useProjectBreadcrumbs();
  const path = "/" + breadcrumbs.join("/");

  if (!projectId) {
    return null;
  }
  const isFile = !isTableDir(file);

  const fileId = isFile ? file.file_id : undefined;

  const isManagedFile = isFile && fileId !== undefined;

  return (
    <>
      <FavouriteButton
        fullPath={file.fullPath}
        mimeType={isFile ? file.mime_type : undefined}
        projectId={projectId}
        type={isFile ? "file" : "directory"}
      />
      {/* Actions for files only */}

      {/* Managed files are "detached" */}
      {isManagedFile && <DetachDataset fileId={fileId} path={path} projectId={projectId} />}
      {/* Unmanaged files are "deleted" */}
      {!isManagedFile && (
        <DeleteUnmanagedFileButton fileName={file.fileName} path={path} projectId={projectId} />
      )}

      {isFile && (
        <DownloadButton
          href={API_ROUTES.projectFile(projectId, path, file.fileName)}
          size="small"
          title="Download file"
        />
      )}

      {/* Datasets can be created from unmanaged files or managed files at are immutable */}
      {isFile && (!file.immutable || !isManagedFile) && (
        <CreateDatasetFromFileButton file={file} projectId={projectId} />
      )}
    </>
  );
};
