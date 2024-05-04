import { CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";

import { type DownloadButtonProps } from "../../components/downloads/DownloadButton";
import {
  useCurrentProject,
  useIsUserAdminOrEditorOfCurrentProject,
} from "../../hooks/projectHooks";
import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";
import { API_ROUTES } from "../../utils/app/routes";
import { type CreateDatasetFromFileButtonProps } from "./buttons/CreateDatasetFromFileButton";
import { type DeleteDirectoryButtonProps } from "./buttons/DeleteDirectoryButton";
import { type DeleteUnmanagedFileButtonProps } from "./buttons/DeleteUnmanagedFileButton";
import { type DetachDatasetProps } from "./buttons/DetachDataset";
import { FavouriteButton } from "./buttons/FavouriteButton";
import { type RenameButtonProps } from "./buttons/RenameButton";
import { type TableDir, type TableFile } from "./types";
import { isTableDir } from "./utils";

const DownloadButton = dynamic<DownloadButtonProps>(
  () => import("../../components/downloads/DownloadButton").then((mod) => mod.DownloadButton),
  { loading: () => <CircularProgress size="1rem" /> },
);
const DetachDataset = dynamic<DetachDatasetProps>(
  () => import("./buttons/DetachDataset").then((mod) => mod.DetachDataset),
  { loading: () => <CircularProgress size="1rem" /> },
);
const DeleteUnmanagedFileButton = dynamic<DeleteUnmanagedFileButtonProps>(
  () => import("./buttons/DeleteUnmanagedFileButton").then((mod) => mod.DeleteUnmanagedFileButton),
  { loading: () => <CircularProgress size="1rem" /> },
);
const DeleteDirectoryButton = dynamic<DeleteDirectoryButtonProps>(
  () => import("./buttons/DeleteDirectoryButton").then((mod) => mod.DeleteDirectoryButton),
  { loading: () => <CircularProgress size="1rem" /> },
);
const RenameButton = dynamic<RenameButtonProps>(
  () => import("./buttons/RenameButton").then((mod) => mod.RenameButton),
  { loading: () => <CircularProgress size="1rem" /> },
);
const CreateDatasetFromFileButton = dynamic<CreateDatasetFromFileButtonProps>(
  () =>
    import("./buttons/CreateDatasetFromFileButton").then((mod) => mod.CreateDatasetFromFileButton),
  { loading: () => <CircularProgress size="1rem" /> },
);

export interface FileActionsProps {
  /**
   * File the actions act on
   */
  file: TableDir | TableFile;
}

/**
 * Actions the user can execute on a given file
 */
export const FileActions = ({ file }: FileActionsProps) => {
  const project = useCurrentProject();
  const isProjectAdminOrEditor = useIsUserAdminOrEditorOfCurrentProject();

  const breadcrumbs = useProjectBreadcrumbs();
  const path = "/" + breadcrumbs.join("/");

  if (!project?.project_id) {
    return null;
  }
  const isFile = !isTableDir(file);

  const fileId = isFile ? file.file_id : undefined;
  const isManagedFile = fileId !== undefined;

  return (
    <>
      <FavouriteButton
        fullPath={file.fullPath}
        mimeType={isFile ? file.mime_type : undefined}
        projectId={project.project_id}
        type={isFile ? "file" : "directory"}
      />

      {/* Actions for files only */}

      {/* Managed files are "detached" */}
      {!!isManagedFile && (
        <DetachDataset
          disabled={!isProjectAdminOrEditor}
          fileId={fileId}
          path={path}
          projectId={project.project_id}
        />
      )}

      {/* Unmanaged files are "deleted" */}
      {!!isFile && !isManagedFile && (
        <DeleteUnmanagedFileButton
          disabled={!isProjectAdminOrEditor}
          fileName={file.fileName}
          path={path}
          projectId={project.project_id}
        />
      )}
      {!isFile && (
        <DeleteDirectoryButton
          directoryName={file.fileName}
          disabled={!isProjectAdminOrEditor}
          path={path}
          projectId={project.project_id}
        />
      )}

      {!isManagedFile && (
        <RenameButton
          disabled={!isProjectAdminOrEditor}
          path={file.fullPath}
          projectId={project.project_id}
          type={isFile ? "file" : "directory"}
        />
      )}

      {!!isFile && (
        <DownloadButton
          href={
            (process.env.NEXT_PUBLIC_BASE_PATH ?? "") +
            API_ROUTES.projectFile(project.project_id, path, file.fileName, "/api/dm-api")
          }
          size="small"
          title="Download file"
        />
      )}

      {/* Datasets can be created from unmanaged files or managed files at are immutable */}
      {!!isFile && (!file.immutable || !isManagedFile) && (
        <CreateDatasetFromFileButton file={file} projectId={project.project_id} />
      )}
    </>
  );
};
