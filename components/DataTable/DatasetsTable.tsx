import React, { useMemo } from 'react';
import type { Column } from 'react-table';

import { useGetDatasets } from '@squonk/data-manager-client/dataset';

import { css } from '@emotion/react';
import { Chip, CircularProgress, Typography } from '@material-ui/core';
import DehazeRoundedIcon from '@material-ui/icons/DehazeRounded';
import dynamic from 'next/dynamic';

import { combineLabels, labelFormatter } from '../../utils/labelUtils';
import { CenterLoader } from '../CenterLoader';
import { Chips } from '../Chips';
import { DatasetDetails } from './DatasetDetails/DatasetDetails';
import { DataTable } from './DataTable';
import type { TableDataset } from './types';

const FileUpload = dynamic<Record<string, never>>(
  () => import('../FileUpload/FileUpload').then((mod) => mod.FileUpload),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

export const AllDatasetsTable = () => {
  const columns: Column<TableDataset>[] = useMemo(
    () => [
      {
        accessor: 'fileName',
        Header: 'File Name',
        Cell: ({ value: fileName, row }) => {
          return <DatasetDetails dataset={row.original} />;
        },
      },
      {
        accessor: 'labels',
        Cell: ({ value: labels }) => (
          <Chips>
            {Object.entries(labels).map(([label, values]) => (
              <Chip
                css={css`
                  display: flex;
                  flex-direction: row-reverse;
                  .MuiChip-iconSmall {
                    margin-left: 0;
                    margin-right: 6px;
                  }
                `}
                icon={typeof values === 'string' ? undefined : <DehazeRoundedIcon />}
                key={label}
                label={labelFormatter(label, values)}
                size="small"
                variant="outlined"
              />
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
          labels: combineLabels(dataset.versions),
          ...dataset,
        };
      }),
    [data],
  );

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
        />
      </>
    );
  }
  return <CenterLoader />;
};
