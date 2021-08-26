import React, { useCallback, useMemo } from 'react';
import type { CellProps, Column, PluginHook } from 'react-table';

import { useGetDatasets } from '@squonk/data-manager-client/dataset';

import { Chip, CircularProgress, Typography } from '@material-ui/core';
import dynamic from 'next/dynamic';

import { Chips } from '../Chips';
import type { DatasetActionsProps } from './Actions/DatasetActions';
import { DataTable } from './DataTable';
import type { TableDataset } from './types';

const DatasetActions = dynamic<DatasetActionsProps>(
  () => import('./Actions/DatasetActions').then((mod) => mod.DatasetActions),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

const FileUpload = dynamic<Record<string, never>>(
  () => import('../FileUpload/FileUpload').then((mod) => mod.FileUpload),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

export const AllDatasetsTable = () => {
  const columns: Column<TableDataset>[] = useMemo(
    () => [
      { accessor: 'fileName', Header: 'File Name' },
      {
        accessor: 'labels',
        Cell: ({ value: labels }) => (
          <Chips>
            {labels.map(([label, value]) => (
              <Chip key={label} label={`${label}=${value}`} size="small" variant="outlined" />
            ))}
          </Chips>
        ),
        Header: 'Labels',
      },
      {
        accessor: 'editors',
        Header: 'Editors',
        Cell: ({ value: editors, row }) => {
          return (
            <>
              <i>{row.original.owner}</i>
              {editors.length > 1 && ', '}
              {editors.filter((editor) => editor !== row.original.owner).join(', ')}
            </>
          );
        },
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
          labels: Object.entries(dataset.versions[0].labels ?? {}),
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
