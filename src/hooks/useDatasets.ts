import { useContext } from 'react';

import { DatasetsContext } from '../context/datasets';

/**
 * Consume the GET project/project_id endpoint. User must be authenticated.
 */
export const useDatasets = () => {
  const { datasets, loading, refreshDatasets } = useContext(DatasetsContext);
  return { datasets, loading, refreshDatasets };
};
