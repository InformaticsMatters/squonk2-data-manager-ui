import { useCallback, useEffect, useState } from 'react';

import APIService from '../Services/APIService';
import { Project } from '../Services/apiTypes';

/**
 * Consume the GET projects endpoint. User must be authenticated.
 */
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    const newProjects = await APIService.getAvailableProjects();
    setProjects(newProjects);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);
  return { projects, loading, refreshProjects };
};
