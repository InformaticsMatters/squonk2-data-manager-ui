import type { FC } from 'react';
import { useMemo } from 'react';
import React from 'react';
import type { Cell, Column } from 'react-table';

import type { DatasetSchemaGetResponse, Error } from '@squonk/data-manager-client';
import { useGetSchema } from '@squonk/data-manager-client/dataset';

import { Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import type { AxiosError } from 'axios';

import { CenterLoader } from '../../../../CenterLoader';
import { DataTable } from '../../../../DataTable';
import { JSON_SCHEMA_TYPES } from './constants';
import { DatasetSchemaInputCell } from './DatasetSchemaInputCell';
import { DatasetSchemaSelectCell } from './DatasetSchemaSelectCell';
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
 */
export const DatasetSchemaView: FC<DatasetSchemaViewProps> = ({ datasetId, version }) => {
  const {
    data: schema,
    isLoading: isSchemaLoading,
    isError: isSchemaError,
    error: schemaError,
  } = useGetSchema<DatasetSchemaGetResponse, AxiosError<Error>>(datasetId, version);

  const { fields, changeSchemaDescription } = useEditableSchemaView(schema);
  type FieldsTableData = NonNullable<typeof fields>[number];

  const columns: Column<FieldsTableData>[] = useMemo(
    () => [
      {
        accessor: 'name',
        Header: 'Field Name',
      },
      {
        id: 'description',
        accessor: (row) => row.description.current,
        Header: 'Description',
        Cell: ({ value, row }: Cell<FieldsTableData>) => {
          const {
            name,
            description: { original },
          } = row.original;
          return (
            <DatasetSchemaInputCell
              field={name}
              fieldKey="description"
              originalValue={original}
              updateField={(value) => changeSchemaDescription(name, 'description', value)}
              value={value}
            />
          );
        },
      },
      {
        id: 'type',
        accessor: (row) => row.type.current,
        Header: 'Type',
        Cell: ({ value, row }: Cell<FieldsTableData>) => {
          const {
            name,
            type: { original },
          } = row.original;
          return (
            <DatasetSchemaSelectCell
              field={name}
              fieldKey="type"
              options={JSON_SCHEMA_TYPES}
              originalValue={original}
              updateField={(value) => changeSchemaDescription(name, 'type', value)}
              value={value}
            />
          );
        },
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
