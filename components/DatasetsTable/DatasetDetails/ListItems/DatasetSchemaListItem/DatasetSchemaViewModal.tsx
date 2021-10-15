import type { FC } from 'react';
import { useMemo } from 'react';
import React from 'react';
import type { Cell, Column } from 'react-table';

import { Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import { CenterLoader } from '../../../../CenterLoader';
import { DataTable } from '../../../../DataTable';
import { ModalWrapper } from '../../../../modals/ModalWrapper';
import { JSON_SCHEMA_TYPES } from './constants';
import { DatasetSchemaDescriptionInput } from './DatasetSchemaDescriptionInput';
import { DatasetSchemaInputCell } from './DatasetSchemaInputCell';
import { DatasetSchemaSelectCell } from './DatasetSchemaSelectCell';
import type { TableSchemaView } from './types';
import { useDatasetSchema } from './useDatasetSchema';

export interface DatasetSchemaViewModalProps {
  /**
   * ID of the dataset to manage the schema of a dataset version
   */
  datasetId: string;
  /**
   * Version number of the version to manage
   */
  version: number;
  open: boolean;
  onClose: () => void;
}

/**
 * Displays the schema of a version of a dataset in a tabular format.
 */
export const DatasetSchemaViewModal: FC<DatasetSchemaViewModalProps> = ({
  datasetId,
  version,
  open,
  onClose,
}) => {
  const {
    editableSchema,
    isSchemaLoading,
    isSchemaError,
    schemaError,
    isSaving,
    isSavingError,
    savingErrors,
    saveSchema,
  } = useDatasetSchema(datasetId, version);
  const { originalSchema, schema, wasSchemaEdited, changeSchemaField, changeSchemaDescription } =
    editableSchema;

  // Table data so we memoize it for react-table
  const fields = useMemo<TableSchemaView[] | undefined>(() => {
    if (schema && originalSchema) {
      return Object.entries(schema.fields).map(([name, field]) => {
        return {
          name,
          description: {
            current: field.description,
            original: originalSchema.fields[name].description,
          },
          type: {
            current: field.type,
            original: originalSchema.fields[name].type,
          },
        };
      });
    }
    return undefined;
  }, [schema, originalSchema]);

  const columns: Column<TableSchemaView>[] = useMemo(
    () => [
      {
        accessor: 'name',
        Header: 'Field Name',
      },
      {
        id: 'description',
        accessor: (row) => row.description.current,
        Header: 'Description',
        Cell: ({ row }: Cell<TableSchemaView>) => {
          const {
            name,
            description: { original, current },
          } = row.original;
          return (
            <DatasetSchemaInputCell
              field={name}
              fieldKey="description"
              originalValue={original}
              updateField={(value) => changeSchemaField(name, 'description', value)}
              value={current}
            />
          );
        },
      },
      {
        id: 'type',
        accessor: (row) => row.type.current,
        Header: 'Type',
        Cell: ({ row }: Cell<TableSchemaView>) => {
          const {
            name,
            type: { original, current },
          } = row.original;
          return (
            <DatasetSchemaSelectCell
              field={name}
              fieldKey="type"
              options={JSON_SCHEMA_TYPES}
              originalValue={original}
              updateField={(value) => changeSchemaField(name, 'type', value)}
              value={current}
            />
          );
        },
      },
    ],
    [changeSchemaField],
  );

  const modalContents = (() => {
    if (isSchemaLoading || isSaving) {
      return <CenterLoader />;
    }

    if (isSchemaError) {
      return <Alert severity="warning">{schemaError?.response?.data.error}</Alert>;
    }

    if (fields === undefined) {
      return (
        <Typography color="textSecondary" variant="body2">
          There is no schema for this dataset
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
        {isSavingError &&
          savingErrors.map(({ type, error }) => {
            return (
              <Alert key={type} severity="warning">
                {error.response?.data.error}
              </Alert>
            );
          })}
        <DatasetSchemaDescriptionInput
          originalValue={originalSchema?.description}
          updateDescription={changeSchemaDescription}
          value={schema?.description}
        />
        <DataTable
          columns={columns}
          customCellProps={{ padding: 'none' }}
          data={fields}
          getRowId={(row) => row.name}
          tableContainer={false}
        />
      </>
    );
  })();

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: 'md', fullWidth: true }}
      id={`${datasetId}-schema`}
      open={open}
      submitDisabled={!wasSchemaEdited}
      submitText="Save"
      title="Edit Schema"
      onClose={onClose}
      onSubmit={saveSchema}
    >
      {modalContents}
    </ModalWrapper>
  );
};
