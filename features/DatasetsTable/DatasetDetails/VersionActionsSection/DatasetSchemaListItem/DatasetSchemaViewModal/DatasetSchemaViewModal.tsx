import type { FC } from "react";
import { useMemo } from "react";

import { Alert, Typography } from "@mui/material";
import type { CoreOptions } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";

import { CenterLoader } from "../../../../../../components/CenterLoader";
import { DataTable } from "../../../../../../components/DataTable/DataTable";
import { ModalWrapper } from "../../../../../../components/modals/ModalWrapper";
import type { JSON_SCHEMA_TYPE } from "../../../../../../utils/app/jsonSchema";
import { JSON_SCHEMA_TYPES } from "../../../../../../utils/app/jsonSchema";
import { getErrorMessage } from "../../../../../../utils/next/orvalError";
import { DatasetSchemaDescriptionInput } from "./DatasetSchemaDescriptionInput";
import { DatasetSchemaInputCell } from "./DatasetSchemaInputCell";
import { DatasetSchemaSelectCell } from "./DatasetSchemaSelectCell";
import { useDatasetSchema } from "./useDatasetSchema";

type TableSchemaView = {
  name: string;
  description: {
    original: string;
    current: string;
  };
  type: {
    original: JSON_SCHEMA_TYPE;
    current: JSON_SCHEMA_TYPE;
  };
};

export interface DatasetSchemaViewModalProps {
  /**
   * ID of the dataset to manage the schema of a dataset version.
   */
  datasetId: string;
  /**
   * Version number of the version to manage.
   */
  version: number;
  /**
   * Whether or not the modal is open.
   */
  open: boolean;
  /**
   * Callback when modal is being closed.
   */
  onClose: () => void;
}

const columnHelper = createColumnHelper<TableSchemaView>();

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
  const { originalSchema, schema, setSchemaField, setSchemaDescription } = editableSchema;

  // Memoize data for react-table. Each field (apart from `name`) is represented by an object,
  // which contains the current value and the original value of dataset schema field.
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

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", { header: "Field Name" }),
      columnHelper.accessor((row) => row.description.current, {
        id: "description",
        header: "Description",
        cell: ({ row }) => {
          const {
            name,
            description: { original, current },
          } = row.original;
          return (
            <DatasetSchemaInputCell
              fieldKey="description"
              fieldName={name}
              fieldValue={current}
              originalFieldValue={original}
              setFieldValue={(value) => setSchemaField(name, "description", value)}
            />
          );
        },
      }),
      columnHelper.accessor((row) => row.type.current, {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const {
            name,
            type: { original, current },
          } = row.original;
          return (
            <DatasetSchemaSelectCell
              fieldKey="type"
              fieldName={name}
              fieldValue={current}
              options={JSON_SCHEMA_TYPES}
              originalFieldValue={original}
              setFieldValue={(value) => setSchemaField(name, "type", value)}
            />
          );
        },
      }),
    ],
    [setSchemaField],
  );

  const modalContents = (() => {
    if (isSchemaLoading || isSaving) {
      return <CenterLoader />;
    }

    if (isSchemaError) {
      return <Alert severity="warning">{getErrorMessage(schemaError)}</Alert>;
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

    const getRowId: CoreOptions<TableSchemaView>["getRowId"] = (row) => row.name;

    return (
      <>
        {isSavingError &&
          savingErrors.map(({ type, error }) => {
            return (
              <Alert key={type} severity="warning">
                {getErrorMessage(error)}
              </Alert>
            );
          })}

        <DataTable
          columns={columns}
          customCellProps={{
            style: {
              paddingTop: 12,
              paddingBottom: 12,
            },
          }}
          data={fields}
          getRowId={getRowId}
          tableContainer={false}
          ToolbarChild={
            <DatasetSchemaDescriptionInput
              originalValue={originalSchema?.description}
              setDescription={setSchemaDescription}
              value={schema?.description}
            />
          }
        />
      </>
    );
  })();

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "md", fullWidth: true }}
      id={`${datasetId}-schema`}
      open={open}
      submitText="Save"
      title="Edit Schema"
      onClose={onClose}
      onSubmit={saveSchema}
    >
      {modalContents}
    </ModalWrapper>
  );
};
