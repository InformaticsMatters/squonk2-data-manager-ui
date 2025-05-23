import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { type ProjectId, useCurrentProjectId } from "../hooks/projectHooks";
import { PROJECT_FILE_LOCAL_STORAGE_KEY } from "../utils/next/localStorage";

export type SavedFile = { path: string; type: "directory" | "file"; mimeType?: string };

export type FileState = Record<string, SavedFile[] | undefined>;

type UpdateFileSelection = (projectId: string) => (filePath: SavedFile) => void;

const selectedFilesAtom = atomWithStorage(PROJECT_FILE_LOCAL_STORAGE_KEY, {} as FileState);

export const useSelectedFiles = (projectId?: ProjectId) => {
  const { projectId: currentProjectId } = useCurrentProjectId();

  const [selectedFiles, setSelectedFiles] = useAtom(selectedFilesAtom);

  // Allow use of argument or default to context if nothing is provided
  const project = projectId ?? currentProjectId;
  const oldSavedFiles = typeof project === "string" ? selectedFiles[project] : undefined;

  const addFile: UpdateFileSelection = (projectId) => (file) => {
    if (oldSavedFiles === undefined) {
      setSelectedFiles({ ...selectedFiles, [projectId]: [file] });
    } else {
      setSelectedFiles({ ...selectedFiles, [projectId]: [...oldSavedFiles, file] });
    }
  };

  const removeFile: UpdateFileSelection = (projectId) => (file) => {
    if (oldSavedFiles !== undefined) {
      setSelectedFiles({
        ...selectedFiles,
        [projectId]: oldSavedFiles.filter((savedFile) => savedFile.path !== file.path),
      });
    }
  };

  if (project) {
    return {
      selectedFiles: selectedFiles[project] ?? [],
      addFile: addFile(project),
      removeFile: removeFile(project),
    };
  }
  return {};
};
