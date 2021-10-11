import React, { useMemo } from 'react';
import type { Column, Row } from 'react-table';

import type { DatasetsGetResponse, Error as DMError } from '@squonk/data-manager-client';
import { useGetDatasets } from '@squonk/data-manager-client/dataset';

import { CircularProgress, Typography } from '@material-ui/core';
import type { AxiosError } from 'axios';
import dynamic from 'next/dynamic';

import { combineLabels } from '../../utils/labelUtils';
import { Chips } from '../Chips';
import { DataTable } from '../DataTable';
import { LabelChip } from '../labels/LabelChip';
import { DatasetDetails } from './DatasetDetails/DatasetDetails';
import { FileTypeFilter } from './filters/FileTypeFilter';
import { LabelFilter } from './filters/LabelFilter';
import { UserFilter } from './filters/UserFilter';
import { DatasetsToolbar } from './DatasetsToolbar';
import type { TableDataset } from './types';
import { useDatasetsParams } from './useDatasetsParams';

const FileUpload = dynamic<Record<string, never>>(
  () => import('../FileUpload').then((mod) => mod.FileUpload),
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

  const { datasetsParams, label, setLabel, user, setUser, fileType, setFileType } =
    useDatasetsParams();
  const { data, error, isError, isLoading } = useGetDatasets<
    DatasetsGetResponse,
    AxiosError<DMError>
  >(datasetsParams);

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

  return (
    <>
      <Typography gutterBottom component="h1" variant="h1">
        Datasets
      </Typography>
      <DataTable
        columns={columns}
        data={datasets}
        error={error}
        getRowId={(row) => row.dataset_id}
        isError={isError}
        isLoading={isLoading}
        ToolbarChild={
          <DatasetsToolbar>
            <FileUpload />
            <UserFilter setUser={setUser} user={user} />
            <FileTypeFilter fileType={fileType} setFileType={setFileType} />
            <LabelFilter label={label} setLabel={setLabel} />
          </DatasetsToolbar>
        }
      />
    </>
  );
};
