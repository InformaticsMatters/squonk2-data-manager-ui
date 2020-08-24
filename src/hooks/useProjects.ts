import { useCallback } from 'react';

import APIService from '../Services/APIService';
import { usePromise } from './usePromise';

/**
 * Consume the GET projects endpoint. User must be authenticated.
 */
export const useProjects = () => {
  // Callback needs to be wrapped since useCallback changes this
  const func = useCallback(() => APIService.getAvailableProjects(), []);
  const { data: projects, loading } = usePromise(func, []);
  return { projects, loading };
};
