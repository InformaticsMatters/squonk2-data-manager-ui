import { useGetAvailableDatasets } from '@squonk/data-manager-client';

import { DataTable } from './DataTable';

export const AllDatasetsTable = () => {
  const { data, isLoading } = useGetAvailableDatasets();

  if (!isLoading) {
    // Transform all datasets to match the data-table props
    const rows = (data?.datasets ?? []).map(
      ({ dataset_id, file_name, owner, editors, published }) => ({
        id: dataset_id as string,
        fileName: file_name as string,
        owner: owner as string,
        editors: editors as string[],
        published: published as string,
        path: null,
        actions: {},
      }),
    );

    return <DataTable rows={rows} />;
  }
  return <div>Orphans Loading...</div>;
};
