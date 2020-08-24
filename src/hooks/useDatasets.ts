import { useCallback } from 'react';

import APIService from '../Services/APIService';
import { usePromise } from './usePromise';

/**
 * Consume the GET datasets endpoint. User must be authenticated.
 */
export const useDatasets = () => {
  // Callback needs to be wrapped since useCallback changes this
  const func = useCallback(() => APIService.getAvailableDatasets(), []);
  const { data: datasets, loading } = usePromise(func, []);
  return { datasets, loading };
};
