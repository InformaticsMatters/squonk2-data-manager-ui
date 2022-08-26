import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { PROJECT_FILE_LOCAL_STORAGE_KEY } from "../constants/localStorageKeys";
import type { ProjectId } from "../hooks/projectHooks";
import { useCurrentProjectId } from "../hooks/projectHooks";

export type SavedFile = {
  path: string;
  type: "file" | "directory";
  mimeType?: string;
};

interface FileState {
  [projectId: string]: SavedFile[] | undefined;
}

type UpdateFileSelection = (projectId: string) => (filePath: SavedFile) => void;

const selectedFilesAtom = atomWithStorage(PROJECT_FILE_LOCAL_STORAGE_KEY, {} as FileState);

export const useSelectedFiles = (projectId?: ProjectId) => {
  const { projectId: currentProjectId } = useCurrentProjectId();

  const [selectedFiles, setSelectedFiles] = useAtom(selectedFilesAtom);

  // Allow use of argument or default to context if nothing is provided
  const project = projectId || currentProjectId;
  const oldSavedFiles = typeof project === "string" ? selectedFiles[project] : undefined;

  const addFile: UpdateFileSelection = (projectId) => (file) => {
    if (oldSavedFiles !== undefined) {
      setSelectedFiles({ ...selectedFiles, [projectId]: [...oldSavedFiles, file] });
    } else {
      setSelectedFiles({ ...selectedFiles, [projectId]: [file] });
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
