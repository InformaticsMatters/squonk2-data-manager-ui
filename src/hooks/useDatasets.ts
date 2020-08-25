import { useCallback } from 'react';

import APIService from '../Services/APIService';
import { usePromise } from './usePromise';

/**
 * Consume the GET project/project_id endpoint. User must be authenticated.
 */
export const useDatasets = (projectId?: string) => {
  // Callback needs to be wrapped since useCallback changes this
  const func = useCallback(() => {
    if (projectId !== undefined) {
      return APIService.getDatasetsFromProject(projectId);
    }
    return Promise.resolve([]);
  }, [projectId]);
  const { data: datasets, loading } = usePromise(func, []);
  return { datasets, loading };
};
