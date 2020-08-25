import { useContext } from 'react';

import { ProjectsContext } from '../context/projects';

/**
 * Consume the GET projects endpoint. User must be authenticated.
 */
export const useProjects = () => {
  const { projects, loading, refreshProjects } = useContext(ProjectsContext);
  return { projects, loading, refreshProjects };
};
