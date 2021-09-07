import type { FC } from 'react';
import React, { Fragment } from 'react';

import type { DatasetSchemaGetResponse, Error } from '@squonk/data-manager-client';
import { useGetSchema } from '@squonk/data-manager-client/dataset';

import { Grid, Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import type { AxiosError } from 'axios';

import { CenterLoader } from '../../CenterLoader';

export interface DatasetSchemaViewProps {
  datasetId: string;
  version: number;
}

interface Field {
  description: string;
  type: 'float' | 'text' | 'integer' | 'object';
}

type Fields = Record<string, Field>;

export const DatasetSchemaView: FC<DatasetSchemaViewProps> = ({ datasetId, version }) => {
  const {
    data: schema,
    isLoading: isSchemaLoading,
    isError: isSchemaError,
    error: schemaError,
  } = useGetSchema<DatasetSchemaGetResponse, AxiosError<Error>>(datasetId, version);

  if (isSchemaLoading) {
    return <CenterLoader />;
  }

  if (isSchemaError) {
    return <Alert severity="warning">{schemaError?.response?.data.error}</Alert>;
  }

  if (schema === undefined) {
    return (
      <Typography color="textSecondary" variant="body2">
        There no schema for this dataset
      </Typography>
    );
  }

  const typedSchema = schema as { fields: Fields } & DatasetSchemaGetResponse;

  return (
    <>
      <Typography component="h3" variant="h6">
        {schema.description}
      </Typography>
      <Grid container spacing={1}>
        {Object.entries(typedSchema.fields).map(([name, field]) => (
          <Fragment key={name}>
            <Grid item xs={4}>
              <Typography>{name}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography>{field.description}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography>{field.type}</Typography>
            </Grid>
          </Fragment>
        ))}
      </Grid>
    </>
  );
};
