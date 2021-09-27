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

// These types should be defined in the OpenAPI but currently aren't
// TODO: replace these with types of data-manager-client when they exist there
interface Field {
  description: string;
  type: 'float' | 'text' | 'integer' | 'object'; // These will be replaced with JSON Schema types
}
type Fields = Record<string, Field>;

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

  // Need to assert the fields here as the OpenAPI types are wrong
  const typedSchema = schema as ({ fields: Fields } & DatasetSchemaGetResponse) | undefined;

  // table data so we monoize it for react-table
  const fields = useMemo(
    () =>
      typedSchema !== undefined
        ? Object.entries(typedSchema.fields).map(([name, field]) => ({ name, ...field }))
        : undefined,
    [typedSchema],
  );

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
      },
      {
        accessor: 'type',
        Header: 'Type',
      },
    ],
    [],
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
        data={fields}
        getRowId={(row) => row.name}
        tableContainer={false}
      />
    </>
  );
};
