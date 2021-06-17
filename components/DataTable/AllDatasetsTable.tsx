import React from 'react';

import { Typography } from '@material-ui/core';
import { useGetAvailableDatasets } from '@squonk/data-manager-client';

import { DataTable } from './DataTable';

export const AllDatasetsTable = () => {
  const { data, isLoading } = useGetAvailableDatasets();

  if (!isLoading) {
    // Transform all datasets to match the data-table props
    const rows = (data?.datasets ?? []).map(
      ({ dataset_id, file_name, owner, editors, published }) => ({
        id: dataset_id,
        fileName: file_name,
        owner: owner,
        editors: editors,
        published: published,
        path: '',
        fullPath: null,
        actions: {},
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
