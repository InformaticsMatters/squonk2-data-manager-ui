import type { FC } from 'react';
import { useMemo } from 'react';
import React from 'react';
import type { Column } from 'react-table';

import type { DatasetSchemaGetResponse, Error } from '@squonk/data-manager-client';
import { useGetSchema } from '@squonk/data-manager-client/dataset';

import { Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import type { AxiosError } from 'axios';

import { CenterLoader } from '../../../../CenterLoader';
import { DataTable } from '../../../../DataTable';
import { DatasetSchemaEditableCell } from './DatasetSchemaEditableCell';
import { useEditableSchemaView } from './useEditableSchemaView';

export interface DatasetSchemaViewProps {
  /**
   * ID of the dataset to manage the schema of a dataset version
   */
  datasetId: string;
  /**
   * Version number of the version to manage
   */
  version: number;
}

/**
 * Displays the schema of a version of a dataset in a tabular format.
 *
 * TODO: allow editing of the meta description
 * TODO: allow editing of schema types and descriptions
 */
export const DatasetSchemaView: FC<DatasetSchemaViewProps> = ({ datasetId, version }) => {
  const {
    data: schema,
    isLoading: isSchemaLoading,
    isError: isSchemaError,
    error: schemaError,
  } = useGetSchema<DatasetSchemaGetResponse, AxiosError<Error>>(datasetId, version);

  const { fields, changeSchemaDescription } = useEditableSchemaView(schema);

  // TODO: all custom Cells here to have fields that can be edited
  const columns: Column<NonNullable<typeof fields>[number]>[] = useMemo(
    () => [
      {
        accessor: 'name',
        Header: 'Field Name',
      },
      {
        accessor: 'description',
        Header: 'Description',
        Cell: ({ value, row }) => {
          return (
            <DatasetSchemaEditableCell
              field={row.original.name}
              fieldKey="description"
              updateField={changeSchemaDescription}
              value={value}
            />
          );
        },
      },
      {
        accessor: 'type',
        Header: 'Type',
      },
    ],
    [changeSchemaDescription],
  );

  if (isSchemaLoading) {
    return <CenterLoader />;
  }

  if (isSchemaError) {
    return <Alert severity="warning">{schemaError?.response?.data.error}</Alert>;
  }

  if (fields === undefined) {
    return (
      <Typography color="textSecondary" variant="body2">
        There no schema for this dataset
      </Typography>
    );
  }

  if (fields.length === 0) {
    return (
      <Typography align="center" color="textSecondary">
        No fields exist in the dataset schema
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="subtitle1">{schema?.description}</Typography>
      <DataTable
        columns={columns}
        customCellProps={{ padding: 'none' }}
        data={fields}
        getRowId={(row) => row.name}
        tableContainer={false}
      />
    </>
  );
};
