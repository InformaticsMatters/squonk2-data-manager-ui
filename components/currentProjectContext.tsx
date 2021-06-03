import React, { useContext, useState } from 'react';

import { useGetAvailableProjects } from '@squonk/data-manager-client';

type CurrentProjectIdState = [
  currentProjectId: string | null,
  setCurrentProject: (newProjectId: string | null) => void,
];

export const CurrentProjectIdContext = React.createContext<CurrentProjectIdState>([
  null,
  () => {
    // Do Nothing
  },
]);

export const CurrentProjectProvider: React.FC = ({ children }) => {
  const state = useState<string | null>(null);

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
  const { data } = useGetAvailableProjects();
  const projects = data?.projects;

  return projects?.find((project) => project.project_id === currentProjectId) ?? null;
};
