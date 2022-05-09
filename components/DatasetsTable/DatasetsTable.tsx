import { useCallback, useMemo } from 'react';
import type { Column, Row } from 'react-table';

import { useGetDatasets } from '@squonk/data-manager-client/dataset';

import { CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';

import { combineLabels } from '../../utils/labelUtils';
import { getErrorMessage } from '../../utils/orvalError';
import { Chips } from '../Chips';
import { DataTable } from '../DataTable';
import { LabelChip } from '../labels/LabelChip';
import { EditorFilter } from './filters/EditorFilter';
import { FileTypeFilter } from './filters/FileTypeFilter';
import { LabelsFilter } from './filters/LabelsFilter';
import { OwnerFilter } from './filters/OwnerFilter';
import type { DatasetDetailsProps } from './DatasetDetails';
import { DatasetsBulkActions } from './DatasetsBulkActions';
import { DatasetsFilterToolbar } from './DatasetsFilterToolbar';
import type { TableDataset } from './types';
import { useDatasetsFilter } from './useDatasetsFilter';
import { useSelectedDatasets } from './useSelectedDatasets';

const FileUpload = dynamic<Record<string, never>>(
  () => import('../FileUpload').then((mod) => mod.FileUpload),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

const DatasetDetails = dynamic<DatasetDetailsProps>(
  () => import('./DatasetDetails').then((mod) => mod.DatasetDetails),
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
          return (
            <DatasetDetails
              dataset={row.original.datasetSummary}
              datasetName={row.original.datasetSummary.versions[0].file_name}
              version={row.original.datasetVersion}
            />
          );
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
        Cell: ({ value: editors }) => {
          return editors.join(', ');
        },
      },
      {
        id: 'versions',
        accessor: (row) => row.subRows.length || '',
        Header: 'Versions',
      },
      {
        accessor: (row) => row.numberOfProjects,
        Header: 'Number of projects',
      },
    ],
    [],
  );

  const { params, filter, setFilterItem } = useDatasetsFilter();
  const { data, error, isError, isLoading } = useGetDatasets(params);

  // Transform all datasets to match the data-table props
  const datasets: TableDataset[] = useMemo(
    () =>
      data?.datasets.map((dataset) => {
        const fileName = dataset.versions[0].file_name; // TODO: should either use the newest version or wait for the API to change
        const numberOfProjects = new Set(
          dataset.versions.map((version) => version.projects.map((project) => project)).flat(),
        ).size;

        return {
          type: 'row',
          ...dataset,
          fileName,
          numberOfProjects,
          datasetSummary: dataset,
          labels: combineLabels(dataset.versions),
          datasetVersion: dataset.versions[0],
          subRows: dataset.versions.map<TableDataset>((version) => ({
            type: 'subRow',
            ...dataset,
            fileName: `Version: ${version.version}`,
            numberOfProjects: version.projects.length,
            labels: (version.labels || {}) as Record<string, string | string[]>,
            version: version.version,
            datasetSummary: dataset,
            datasetVersion: version,
            subRows: [],
            owner: version.owner,
          })),
        };
      }) || [],
    [data],
  );

  const { selectedDatasets, onSelection } = useSelectedDatasets(datasets);

  const { owner, editor, fileType, labels } = filter;
  const getRowId = useCallback((row) => `${row.dataset_id}#${row.version}`, []);

  return (
    <DataTable
      subRowsEnabled
      columns={columns}
      data={datasets}
      error={getErrorMessage(error)}
      getRowId={getRowId}
      initialSelection={[]}
      isError={isError}
      isLoading={isLoading}
      ToolbarActionChild={<DatasetsBulkActions selectedDatasets={selectedDatasets} />}
      ToolbarChild={
        <>
          <FileUpload />
          <DatasetsFilterToolbar
            fullWidthFilters={
              <LabelsFilter
                labels={labels}
                setLabels={(labels) => setFilterItem('labels', labels)}
              />
            }
            shrinkableFilters={[
              <OwnerFilter
                key="owner"
                owner={owner}
                setOwner={(owner) => setFilterItem('owner', owner)}
              />,
              <EditorFilter
                editor={editor}
                key="editor"
                setEditor={(editor) => setFilterItem('editor', editor)}
              />,
              <FileTypeFilter
                fileType={fileType}
                key="fileType"
                setFileType={(fileType) => setFilterItem('fileType', fileType)}
              />,
            ]}
          />
        </>
      }
      onSelection={onSelection}
    />
  );
};
