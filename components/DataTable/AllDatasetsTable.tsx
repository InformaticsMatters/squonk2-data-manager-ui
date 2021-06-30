import React from 'react';

import { Typography } from '@material-ui/core';
import { useGetAvailableDatasets } from '@squonk/data-manager-client/dataset';

import { DataTable } from './DataTable';
import { TableDataset } from './types';

export const AllDatasetsTable = () => {
  const { data } = useGetAvailableDatasets();

  if (data) {
    // Transform all datasets to match the data-table props
    const rows: TableDataset[] = data.datasets.map(
      ({ dataset_id, file_name, owner, editors, published }) => ({
        fileName: file_name,
        id: dataset_id,
        owner,
        editors,
        published,
      }),
    );

    return (
      <>
        <Typography variant="h4" component="h1">
          Datasets
        </Typography>
        <DataTable rows={rows} />
      </>
    );
  }
  return <div>Orphans Loading...</div>;
};
