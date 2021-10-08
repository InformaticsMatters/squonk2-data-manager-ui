import React, { useMemo } from 'react';
import type { Column, Row } from 'react-table';

import { useGetDatasets } from '@squonk/data-manager-client/dataset';

import { CircularProgress, Typography } from '@material-ui/core';
import dynamic from 'next/dynamic';

import { combineLabels } from '../../utils/labelUtils';
import { CenterLoader } from '../CenterLoader';
import { Chips } from '../Chips';
import { DataTable } from '../DataTable';
import { LabelChip } from '../labels/LabelChip';
import { DatasetDetails } from './DatasetDetails/DatasetDetails';
import { DatasetToolbar } from './DatasetToolbar';
import type { FileTypeFilterProps, UserFilterProps } from './filters';
import type { TableDataset } from './types';
import { useDatasetsParams } from './useDatasetsParams';

const FileUpload = dynamic<Record<string, never>>(
  () => import('../FileUpload').then((mod) => mod.FileUpload),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

const UserFilter = dynamic<UserFilterProps>(
  () => import('./filters').then((mod) => mod.UserFilter),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

const FileTypeFilter = dynamic<FileTypeFilterProps>(
  () => import('./filters').then((mod) => mod.FileTypeFilter),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

const editorsSorter = (rowA: Row<TableDataset>, rowB: Row<TableDataset>) => {
  if (rowA.original.editors.join(' ') > rowB.original.editors.join(' ')) {
    return 1;
  }
  return -1;
};

/**
 * MuiTable managed by react-table that displays datasets viewable by the user with option to see
 * further details of a dataset.
 */
export const DatasetsTable = () => {
  const columns: Column<TableDataset>[] = useMemo(
    () => [
      {
        accessor: 'fileName',
        Header: 'File Name',
        Cell: ({ row }) => {
          return <DatasetDetails dataset={row.original} />;
        },
      },
      {
        accessor: 'labels',
        Cell: ({ value: labels }) => (
          <Chips>
            {Object.entries(labels).map(([label, values]) => (
              <LabelChip key={label} label={label} values={values} />
            ))}
          </Chips>
        ),
        Header: 'Labels',
      },
      {
        accessor: 'editors',
        Header: 'Editors',
        sortType: editorsSorter,
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

  const { datasetsParams, changeDatasetsParam } = useDatasetsParams();
  const { dataset_mime_type, labels, username } = datasetsParams;
  const { data } = useGetDatasets(datasetsParams);

  // Transform all datasets to match the data-table props
  const datasets: TableDataset[] | undefined = useMemo(
    () =>
      data?.datasets.map((dataset) => {
        const fileName = dataset.versions[0].file_name; // TODO: should either use the newest version or wait for the API to change
        return {
          fileName,
          labels: combineLabels(dataset.versions),
          ...dataset,
        };
      }),
    [data],
  );

  if (datasets) {
    return (
      <>
        <Typography gutterBottom component="h1" variant="h1">
          Datasets
        </Typography>
        <DataTable
          columns={columns}
          data={datasets}
          getRowId={(row) => row.dataset_id}
          ToolbarChild={
            <DatasetToolbar>
              <FileUpload />
              <UserFilter value={username} onChange={changeDatasetsParam('username')} />
              <FileTypeFilter
                value={dataset_mime_type}
                onChange={changeDatasetsParam('dataset_mime_type')}
              />
            </DatasetToolbar>
          }
        />
      </>
    );
  }

  return <CenterLoader />;
};
