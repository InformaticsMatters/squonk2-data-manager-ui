import { useEffect, useState } from 'react';

import APIService from '../Services/APIService';
import { Project } from '../Services/apiTypes';

/**
 * Consume the GET projects endpoint. User must be authenticated.
 */
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setProjects(await APIService.getAvailableProjects());
      setLoading(false);
    };
    fetchData();
  }, []);

  return { projects, loading };
};
