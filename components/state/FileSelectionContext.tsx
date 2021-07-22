import React, { useContext, useReducer } from 'react';

import type { ProjectId } from '../state/currentProjectHooks';
import { useCurrentProjectId } from '../state/currentProjectHooks';

type SavedFile = string; // General in case we want to store more than the file path

interface FileState {
  [key: string]: SavedFile[] | undefined;
}

type UpdateFileSelection = (projectId: string) => (filePaths: SavedFile[]) => void;

type SelectedFilesState = {
  selectedFiles: FileState;
  updateSelectedFiles: UpdateFileSelection;
};

const initialState: SelectedFilesState = {
  selectedFiles: {},
  updateSelectedFiles: () => () => {
    // Do Nothing
  },
};

export const SelectedFilesContext = React.createContext<SelectedFilesState>(initialState);

interface FileStateAction {
  type: 'replace-files';
  projectId: string;
  files: SavedFile[];
}

const reducer = (state: FileState, { type, projectId, files }: FileStateAction) => {
  switch (type) {
    case 'replace-files':
      state[projectId] = files;
      return { ...state };
    default:
      throw new Error(`${type} is not a valid reducer`);
  }
};

export const SelectedFilesProvider: React.FC = ({ children }) => {
  const [selectedFiles, dispatch] = useReducer(reducer, {});

  const updateSelectedFiles: UpdateFileSelection = (projectId) => (files) =>
    dispatch({ type: 'replace-files', projectId, files });

  return (
    <SelectedFilesContext.Provider value={{ selectedFiles, updateSelectedFiles }}>
      {children}
    </SelectedFilesContext.Provider>
  );
};

export const useSelectedFilesFromProject = (projectId: ProjectId) => {
  const { selectedFiles, updateSelectedFiles } = useContext(SelectedFilesContext);

  if (projectId) {
    const boundUpdateSelectedFiles = updateSelectedFiles(projectId);
    const selectedFilesForProject = selectedFiles[projectId];

    return {
      selectedFiles: selectedFilesForProject ?? [],
      updateSelectedFiles: boundUpdateSelectedFiles,
    };
  }
};

export const useSelectedFiles = (projectId?: ProjectId) => {
  const { projectId: currentProjectId } = useCurrentProjectId();

  return useSelectedFilesFromProject(projectId ?? currentProjectId);
};
