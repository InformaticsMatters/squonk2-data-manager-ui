import React, { useCallback, useMemo } from 'react';
import type { CellProps, Column, PluginHook } from 'react-table';

import { useGetDatasets } from '@squonk/data-manager-client/dataset';

import { Typography } from '@material-ui/core';

import { FileUpload } from '../FileUpload/FileUpload';
import { DatasetActions } from './DatasetActions';
import { DataTable } from './DataTable';
import type { TableDataset } from './types';

export const AllDatasetsTable = () => {
  const columns: Column<TableDataset>[] = useMemo(
    () => [
      { accessor: 'fileName', Header: 'File Name' },
      {
        id: 'editors',
        accessor: (row) => row.editors.join(', '),
        Header: 'Editors',
      },
      {
        id: 'versions',
        accessor: (row) => row.versions.length,
        Header: 'Versions',
      },
    ],
    [],
  );

  const { data } = useGetDatasets();

  // Transform all datasets to match the data-table props
  const datasets: TableDataset[] | undefined = useMemo(
    () =>
      data?.datasets.map((dataset) => {
        const fileName = dataset.versions[0].file_name; // TODO: should either use the newest version or wait for the API to change
        return {
          fileName,
          ...dataset,
        };
      }),
    [data],
  );

  // react-table plugin to add actions buttons for datasets
  const useActionsColumnPlugin: PluginHook<TableDataset> = useCallback((hooks) => {
    hooks.visibleColumns.push((columns) => {
      return [
        ...columns,
        {
          id: 'actions',
          groupByBoundary: true, // Ensure normal columns can't be ordered before this
          Header: 'Actions',
          Cell: ({ row }: CellProps<TableDataset, any>) => (
            <DatasetActions dataset={row.original} />
          ),
        },
      ];
    });
  }, []);

  if (datasets) {
    return (
      <>
        <Typography gutterBottom component="h1" variant="h4">
          Datasets
        </Typography>
        <DataTable
          columns={columns}
          data={datasets}
          getRowId={(row) => row.dataset_id}
          ToolbarChild={<FileUpload />}
          useActionsColumnPlugin={useActionsColumnPlugin}
        />
      </>
    );
  }
  return <div>Loading Datasets...</div>;
};
