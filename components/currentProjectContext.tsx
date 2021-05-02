import React, { useContext, useState } from 'react';

import { ProjectSummary } from '@squonk/data-manager-client';

type CurrentProjectState = [
  currentProject: ProjectSummary | null,
  setCurrentProject: (newProject: ProjectSummary | null) => void,
];

export const CurrentProjectContext = React.createContext<CurrentProjectState>([
  null,
  () => {
    // Do Nothing
  },
]);

export const CurrentProjectProvider: React.FC = ({ children }) => {
  const state = useState<ProjectSummary | null>(null);

  return <CurrentProjectContext.Provider value={state}>{children}</CurrentProjectContext.Provider>;
};

/**
 * Get the currently selected project from the CurrentProject context
 */
export const useCurrentProject = () => useContext(CurrentProjectContext);
