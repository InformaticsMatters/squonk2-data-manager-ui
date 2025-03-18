import { Fragment } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";

import { Alert, Box, Button, Checkbox, MenuItem, TextField, Typography } from "@mui/material";

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

export const ConfigEditor = ({ schema, config, onChange }: ConfigEditorProps) => {
  const { fields } = schema;

  const fieldsInConfig = Object.keys(config);
  Object.keys(fields).forEach(
    (field) =>
      !fieldsInConfig.includes(field) && (config[field] = getDefault(field, fields[field].type)),
  );

  const { control, register, watch, handleSubmit } = useForm<SDFViewerConfig>({
    defaultValues: config,
  });

  if (Object.values(fields).length === 0) {
    return <Alert severity="warning">No fields found in schema</Alert>;
  }

  const getStep = (field: string) => {
    const type = watch(field).dtype;
    switch (type) {
      case "number":
        return 0.1;
      case "integer":
        return 1;
      default:
        return undefined;
    }
  };

  const getIsNumeric = (key: string) =>
    watch(key).dtype === "number" || watch(key).dtype === "integer";

  // data isn't really of type SDFViewerConfig, inputs give string values instead of numbers, but
  // our Infinity defaults are numbers
  const onSubmit: SubmitHandler<SDFViewerConfig> = (data) => onChange(data);

  // const onSubmit: SubmitHandler<SDFViewerConfig> = (data) => console.log(data);

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit, (errors) => console.log(errors))(event)}>
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
            <TextField
              select
              defaultValue={config[key].dtype}
              slotProps={{ htmlInput: register(`${key}.dtype`) }}
            >
              {JSON_SCHEMA_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <Controller
              control={control}
              defaultValue={config[key].include}
              name={`${key}.include`}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <Controller
              control={control}
              defaultValue={config[key].cardView}
              name={`${key}.cardView`}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <TextField
              defaultValue={config[key].min}
              disabled={!getIsNumeric(key)}
              inputMode="numeric"
              slotProps={{ htmlInput: { ...register(`${key}.min`), step: getStep(key) } }}
              sx={{ width: "7em" }}
              type="number"
            />
            <TextField
              defaultValue={config[key].max}
              disabled={!getIsNumeric(key)}
              inputMode="numeric"
              slotProps={{ htmlInput: { ...register(`${key}.max`), step: getStep(key) } }}
              sx={{ width: "7em" }}
              type="number"
            />
            <TextField
              disabled
              select
              defaultValue={config[key].sort}
              slotProps={{ htmlInput: register(`${key}.sort`) }}
            >
              <MenuItem key="ASC" value="ASC">
                ASC
              </MenuItem>
              <MenuItem key="DESC" value="DESC">
                DESC
              </MenuItem>
            </TextField>
          </Fragment>
        ))}
        <Button sx={{ gridColumn: -2 }} type="submit" variant="contained">
          Apply
        </Button>
      </Box>
    </form>
  );
};
