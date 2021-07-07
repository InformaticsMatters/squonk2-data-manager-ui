import React from 'react';

import { Typography } from '@material-ui/core';
import { useGetDatasets } from '@squonk/data-manager-client/dataset';

import { DataTable } from './DataTable';
import { TableDataset } from './types';

export const AllDatasetsTable = () => {
  const { data } = useGetDatasets();

  const datasets = data?.datasets;

  if (datasets) {
    // Transform all datasets to match the data-table props
    const rows: TableDataset[] = datasets.map(({ dataset_id, versions, owner, editors }) => {
      const fileName = versions[0].file_name;
      return {
        fileName,
        dataset_id,
        owner,
        editors,
        versions,
      };
    });

    return (
      <>
        <Typography variant="h4" component="h1">
          Datasets
        </Typography>
        <DataTable
          rows={rows}
          columns={[
            { name: 'fileName', title: 'File Name' },
            { name: 'owner', title: 'Owner' },
            { name: 'numberOfVersions', title: 'Versions' },
            { name: 'actions', title: 'Actions' },
            // { name: 'fullPath', title: 'Full Path' },
          ]}
        />
      </>
    );
  }
  return <div>Loading Datasets...</div>;
};
