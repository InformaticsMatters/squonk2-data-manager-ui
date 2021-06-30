import React, { useContext, useState } from 'react';

import { useGetProjects } from '@squonk/data-manager-client/project';

export type ProjectId = string | null;

type CurrentProjectIdState = [
  currentProjectId: ProjectId,
  setCurrentProject: (newProjectId: ProjectId) => void,
];

export const CurrentProjectIdContext = React.createContext<CurrentProjectIdState>([
  null,
  () => {
    // Do Nothing
  },
]);

export const CurrentProjectProvider: React.FC = ({ children }) => {
  const state = useState<ProjectId>(null);

  return (
    <CurrentProjectIdContext.Provider value={state}>{children}</CurrentProjectIdContext.Provider>
  );
};

/**
 * Get the currently selected project from the CurrentProject context
 */
export const useCurrentProjectId = () => useContext(CurrentProjectIdContext);

export const useCurrentProject = () => {
  const [currentProjectId] = useContext(CurrentProjectIdContext);
  const { data } = useGetProjects();
  const projects = data?.projects;

  return projects?.find((project) => project.project_id === currentProjectId) ?? null;
};
