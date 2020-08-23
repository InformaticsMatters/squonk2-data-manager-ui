import { useEffect, useState } from 'react';

import APIService from '../Services/APIService';
import { Project } from '../Services/apiTypes';
import { useIsAuthenticated } from './useIsAuthenticated';

/**
 * Consume the GET projects endpoint. User must be authenticated.
 */
export const useProjects = () => {
  const isAuthenticated = useIsAuthenticated();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        setProjects(await APIService.getAvailableProjects());
      }
    };
    fetchData();
  }, [isAuthenticated]);

  return projects;
};
