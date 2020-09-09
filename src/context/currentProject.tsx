import React, { useState } from 'react';

import { Project } from '../Services/apiTypes';

interface CurrentProjectState {
  currentProject: Project | null;
  setCurrentProject: (newProject: Project | null) => void;
}

export const CurrentProjectContext = React.createContext<CurrentProjectState>({
  currentProject: null,
  setCurrentProject: () => {},
});

export const CurrentProjectProvider: React.FC = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  return (
    <CurrentProjectContext.Provider value={{ currentProject, setCurrentProject }}>
      {children}
    </CurrentProjectContext.Provider>
  );
};
