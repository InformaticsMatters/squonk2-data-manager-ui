import React, { useContext, useReducer } from 'react';

import type { ProjectId } from '../../hooks/currentProjectHooks';
import { useCurrentProjectId } from '../../hooks/currentProjectHooks';

export type SavedFile = {
  path: string;
  type: 'file' | 'directory';
  mimeType?: string;
};

interface FileState {
  [projectId: string]: SavedFile[] | undefined;
}

type UpdateFileSelection = (projectId: string) => (filePath: SavedFile) => void;

type SelectedFilesState = {
  selectedFiles: FileState;
  addFile: UpdateFileSelection;
  removeFile: UpdateFileSelection;
};

const initialState: SelectedFilesState = {
  selectedFiles: {},
  addFile: () => () => {
    // Do nothing
  },
  removeFile: () => () => {
    // Do nothing
  },
};

export const SelectedFilesContext = React.createContext<SelectedFilesState>(initialState);

interface FileStateAction {
  type: 'add-file' | 'remove-file';
  projectId: string;
  file: SavedFile;
}

const reducer = (state: FileState, { type, projectId, file }: FileStateAction) => {
  const oldSavedFiles = state[projectId];
  switch (type) {
    case 'add-file': {
      if (oldSavedFiles !== undefined) {
        return { ...state, [projectId]: [...oldSavedFiles, file] };
      }
      return { ...state, [projectId]: [file] };
    }
    case 'remove-file':
      if (oldSavedFiles !== undefined) {
        return {
          ...state,
          [projectId]: oldSavedFiles.filter((savedFile) => savedFile.path !== file.path),
        };
      }
      return state;
    default:
      throw new Error(`${type} is not a valid reducer`);
  }
};

export const SelectedFilesProvider: React.FC = ({ children }) => {
  const [selectedFiles, dispatch] = useReducer(reducer, {});

  const addFile: UpdateFileSelection = (projectId) => (file) =>
    dispatch({ type: 'add-file', projectId, file });
  const removeFile: UpdateFileSelection = (projectId) => (file) =>
    dispatch({ type: 'remove-file', projectId, file });

  return (
    <SelectedFilesContext.Provider value={{ selectedFiles, addFile, removeFile }}>
      {children}
    </SelectedFilesContext.Provider>
  );
};

export const useSelectedFiles = (projectId?: ProjectId) => {
  const { projectId: currentProjectId } = useCurrentProjectId();

  const { selectedFiles, addFile, removeFile } = useContext(SelectedFilesContext);

  const project = projectId || currentProjectId;

  if (project) {
    return {
      selectedFiles: selectedFiles[project] ?? [],
      addFile: addFile(project),
      removeFile: removeFile(project),
    };
  }
  return {};
};
