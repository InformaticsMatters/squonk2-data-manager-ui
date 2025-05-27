import { Fragment } from "react";

import { Alert, Box, Button, Checkbox, MenuItem, TextField, Typography } from "@mui/material";
import { type Updater, useForm } from "@tanstack/react-form";

import { type SDFViewerConfig } from "../../utils/api/sdfViewer";
import { type JSON_SCHEMA_TYPE, JSON_SCHEMA_TYPES } from "../../utils/app/jsonSchema";

export type Field = { type: JSON_SCHEMA_TYPE; description: string };

export interface Schema {
  $schema: string;
  $id: string;
  title: string;
  description: string;
  version: number;
  type: "object";
  fields: Record<string, Field>;
  required: string[];
  labels: Record<string, string>;
}

export interface ConfigEditorProps {
  schema: Schema;
  config: SDFViewerConfig;
  onChange: (config: SDFViewerConfig) => void;
}

const getDefault = (field: string, dtype: JSON_SCHEMA_TYPE) => ({
  field,
  dtype,
  include: true,
  cardView: true,
  min: Number.NEGATIVE_INFINITY,
  max: Number.POSITIVE_INFINITY,
  sort: "ASC",
});

const getStep = (_field: string, type: JSON_SCHEMA_TYPE) => {
  switch (type) {
    case "number":
      return 0.1;
    case "integer":
      return 1;
    default:
      return undefined;
  }
};

const getIsNumeric = (type: JSON_SCHEMA_TYPE) => type === "number" || type === "integer";

export const ConfigEditor = ({ schema, config, onChange }: ConfigEditorProps) => {
  const { fields } = schema;

  const fieldsInConfig = Object.keys(config);
  Object.keys(fields).forEach(
    (field) =>
      !fieldsInConfig.includes(field) && (config[field] = getDefault(field, fields[field].type)),
  );

  const form = useForm({
    defaultValues: config,
    onSubmit: ({ value }) => {
      onChange(value);
    },
  });

  if (Object.values(fields).length === 0) {
    return <Alert severity="warning">No fields found in schema</Alert>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr repeat(6, min-content)" }}>
        <Typography component="h3" variant="h4">
          Field name
        </Typography>
        <Typography component="h3" variant="h4">
          Type
        </Typography>
        <Typography component="h3" variant="h4">
          Include
        </Typography>
        <Typography component="h3" variant="h4">
          Card view
        </Typography>
        <Typography component="h3" variant="h4">
          Min
        </Typography>
        <Typography component="h3" variant="h4">
          Max
        </Typography>
        <Typography component="h3" variant="h4">
          Sort
        </Typography>

        {Object.entries(fields).map(([key], index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Fragment key={`${key}${index}`}>
            <Typography>{key}</Typography>

            <form.Field defaultValue={config[key].dtype} name={`${key}.dtype`}>
              {(field) => (
                <TextField
                  select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as Updater<JSON_SCHEMA_TYPE>)}
                >
                  {JSON_SCHEMA_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </form.Field>

            <form.Field defaultValue={config[key].include} name={`${key}.include`}>
              {(field) => (
                <Checkbox
                  checked={Boolean(field.state.value)}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />
              )}
            </form.Field>

            <form.Field defaultValue={config[key].cardView} name={`${key}.cardView`}>
              {(field) => (
                <Checkbox
                  checked={Boolean(field.state.value)}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />
              )}
            </form.Field>

            <form.Field defaultValue={config[key].min} name={`${key}.min`}>
              {(field) => (
                <form.Subscribe selector={(state) => state.values[key].dtype}>
                  {(currentType) => (
                    <TextField
                      disabled={!getIsNumeric(currentType)}
                      inputMode="numeric"
                      slotProps={{ htmlInput: { step: getStep(key, currentType) } }}
                      sx={{ width: "7em" }}
                      type="number"
                      value={field.state.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : Number(e.target.value);
                        field.handleChange(value as Updater<number>);
                      }}
                    />
                  )}
                </form.Subscribe>
              )}
            </form.Field>

            <form.Field defaultValue={config[key].max} name={`${key}.max`}>
              {(field) => (
                <form.Subscribe selector={(state) => state.values[key].dtype}>
                  {(currentType) => (
                    <TextField
                      disabled={!getIsNumeric(currentType)}
                      inputMode="numeric"
                      slotProps={{ htmlInput: { step: getStep(key, currentType) } }}
                      sx={{ width: "7em" }}
                      type="number"
                      value={field.state.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : Number(e.target.value);
                        field.handleChange(value as Updater<number>);
                      }}
                    />
                  )}
                </form.Subscribe>
              )}
            </form.Field>

            <form.Field defaultValue={config[key].sort} name={`${key}.sort`}>
              {(field) => (
                <TextField
                  disabled
                  select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as Updater<string>)}
                >
                  <MenuItem key="ASC" value="ASC">
                    ASC
                  </MenuItem>
                  <MenuItem key="DESC" value="DESC">
                    DESC
                  </MenuItem>
                </TextField>
              )}
            </form.Field>
          </Fragment>
        ))}
        <Button sx={{ gridColumn: -2 }} type="submit" variant="contained">
          Apply
        </Button>
      </Box>
    </form>
  );
};
