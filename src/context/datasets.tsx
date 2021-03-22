import React, { useCallback, useEffect, useState } from 'react';

import { Dataset, Project } from '../Services/apiTypes';
import DataTierAPI from '../Services/DataTierAPI';

interface DatasetsState {
  datasets: Dataset[];
  loading: boolean;
  refreshDatasets: () => void;
}

export const DatasetsContext = React.createContext<DatasetsState>({
  datasets: [],
  loading: true,
  refreshDatasets: () => {},
});

interface IProps {
  project: Project | null;
}

export const DatasetsProvider: React.FC<IProps> = ({ children, project }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);

  const projectId = project?.projectId;

  const refreshDatasets = useCallback(async () => {
    setLoading(true);
    if (projectId !== undefined) {
      const newDatasets = await DataTierAPI.getDatasetsFromProject(projectId);
      setDatasets(newDatasets);
    } else {
      const newDatasets = await DataTierAPI.getOwnedDatasets();
      setDatasets(newDatasets);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    <DatasetsContext.Provider value={{ datasets, loading, refreshDatasets }}>
      {children}
    </DatasetsContext.Provider>
  );
};
