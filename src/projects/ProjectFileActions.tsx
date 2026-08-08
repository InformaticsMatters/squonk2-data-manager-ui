import { type ReactNode } from "react";

import {
  AddCircleRounded as AddCircleRoundedIcon,
  DeleteForeverRounded as DeleteForeverRoundedIcon,
  DeleteOutlineRounded as DeleteOutlineRoundedIcon,
} from "@mui/icons-material";

import { DownloadButton } from "../components/downloads/DownloadButton";
import { WarningDeleteButton } from "../components/WarningDeleteButton";
import { useMimeTypeLookup } from "../hooks/useMimeTypeLookup";
import { withBasePath } from "../utils/app/basePath";
import { getMimeFromFileName } from "../utils/app/files";
import { API_ROUTES } from "../utils/app/routes";
import { type ProjectCapability } from "./capabilities";
import { CapabilityIconButton } from "./CapabilityIconButton";
import { fileRowMode, isDirectoryRow, managedFileId, type ProjectFileRow } from "./fileFacts";
import { ProjectFileFavouriteButton } from "./ProjectFileFavouriteButton";
import { ProjectFileRename } from "./ProjectFileRename";
import { useFileCommands } from "./useFileCommands";
import { useFileMutation } from "./useFileMutation";

/**
 * A destructive file action, confirmed before it is sent. The confirmation is only reachable while
 * the capability offers the action, so an explanation of why it is unavailable is never replaced by
 * a dialog the caller cannot complete.
 */
const DestructiveFileAction = ({
  capability,
  icon,
  modalId,
  onDelete,
  submitText,
  title,
}: {
  capability: ProjectCapability;
  icon: ReactNode;
  modalId: string;
  onDelete: () => Promise<void>;
  submitText: string;
  title: string;
}) => (
  <WarningDeleteButton modalId={modalId} submitText={submitText} title={title} onDelete={onDelete}>
    {({ openModal, isDeleting }) => (
      <CapabilityIconButton
        capability={capability}
        isPending={isDeleting}
        size="small"
        title={title}
        onClick={openModal}
      >
        {icon}
      </CapabilityIconButton>
    )}
  </WarningDeleteButton>
);

/**
 * Everything the caller may do with one row of the addressed directory. Every action names the
 * project in the URL and the directory Files is displaying, so no file action can reach a project
 * or a path other than the one on screen. Availability comes from the project's own file-mutation
 * capability, and an action the caller may not use stays visible with the requirement it needs.
 */
export const ProjectFileActions = ({
  capability,
  path,
  projectId,
  row,
  unitId,
}: {
  capability: ProjectCapability;
  path: string;
  projectId: string;
  row: ProjectFileRow;
  /** The project's own containing unit, which is where a dataset made from its files is billed. */
  unitId: string | undefined;
}) => {
  const commands = useFileCommands(projectId);
  const { run } = useFileMutation();
  const mimeLookup = useMimeTypeLookup();

  if (isDirectoryRow(row)) {
    return (
      <>
        <ProjectFileFavouriteButton
          file={{ path: row.fullPath, type: "directory" }}
          projectId={projectId}
        />
        <DestructiveFileAction
          capability={capability}
          icon={<DeleteForeverRoundedIcon />}
          modalId={`delete-directory-${row.fullPath}`}
          submitText="Delete"
          title="Delete directory"
          onDelete={() =>
            run("delete", `the directory ${row.name}`, () =>
              commands.deleteDirectory(path, row.name),
            )
          }
        />
        <ProjectFileRename
          capability={capability}
          fullPath={row.fullPath}
          projectId={projectId}
          type="directory"
        />
      </>
    );
  }

  const mode = fileRowMode(row);
  const fileId = managedFileId(row);
  // A dataset is only made from a file the project holds in its own right: a mutable managed file
  // is already a dataset version, so making another from it would duplicate rather than create.
  const offersDatasetCreation = mode !== "editable";
  const datasetCapability: ProjectCapability =
    unitId === undefined
      ? {
          reason:
            "This project's containing unit could not be resolved, so a dataset cannot be billed for.",
          status: "disabled",
        }
      : capability;

  return (
    <>
      <ProjectFileFavouriteButton
        file={{ mimeType: row.data.mime_type, path: row.fullPath, type: "file" }}
        projectId={projectId}
      />

      {fileId === undefined ? (
        <DestructiveFileAction
          capability={capability}
          icon={<DeleteForeverRoundedIcon />}
          modalId={`delete-file-${row.fullPath}`}
          submitText="Delete"
          title="Delete unmanaged file"
          onDelete={() =>
            run("delete", `the file ${row.name}`, () =>
              commands.deleteUnmanagedFile(path, row.name),
            )
          }
        />
      ) : (
        // A managed file belongs to a dataset, so the project's link to it is removed rather than
        // the file itself. The non-permanent icon says so.
        <DestructiveFileAction
          capability={capability}
          icon={<DeleteOutlineRoundedIcon />}
          modalId={`detach-file-${row.fullPath}`}
          submitText="Detach"
          title="Detach file"
          onDelete={() =>
            run("detach", `the file ${row.name}`, () => commands.detachFile(path, fileId, row.name))
          }
        />
      )}

      {fileId === undefined ? (
        <ProjectFileRename
          capability={capability}
          fullPath={row.fullPath}
          projectId={projectId}
          type="file"
        />
      ) : null}

      <DownloadButton
        href={withBasePath(API_ROUTES.projectFile(projectId, path, row.name, "/api/dm-api"))}
        size="small"
        title="Download file"
      />

      {offersDatasetCreation ? (
        <CapabilityIconButton
          capability={datasetCapability}
          size="small"
          title="Create a dataset from this file"
          onClick={() =>
            void run("create a dataset from", `the file ${row.name}`, () =>
              commands.createDatasetFromFile({
                fileName: row.name,
                mimeType: row.data.mime_type ?? getMimeFromFileName(row.name, mimeLookup),
                path,
                // Only an enabled capability offers the control, and it is disabled without a
                // resolved unit, so the project's unit is a fact by the time this can be used.
                unitId: unitId as string,
              }),
            )
          }
        >
          <AddCircleRoundedIcon />
        </CapabilityIconButton>
      ) : null}
    </>
  );
};
