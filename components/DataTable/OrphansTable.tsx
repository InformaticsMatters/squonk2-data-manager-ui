import { useGetAvailableDatasets } from '@squonk/data-manager-client';

import DataTable from './DataTable';

export const OrphansTable = () => {
  const { data, isLoading } = useGetAvailableDatasets();

  if (!isLoading) {
    // transform the dataset endpoint to match the project endpoint
    const files = data.datasets.map(({ dataset_id, filename, type }: any) => ({
      file_id: dataset_id,
      file_name: filename,
      file_path: '/',
      type: type,
    }));

    return <DataTable files={files} />;
  }
  return <div>Orphans Loading...</div>;
};
