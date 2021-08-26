import type { FC } from 'react';
import { useState } from 'react';
import React from 'react';

import { Divider, Grid, MenuItem, TextField, Typography } from '@material-ui/core';

import type { TableDataset } from '../DataTable/types';
import { Labels } from './Labels';
import { ManageDatasetEditors } from './ManageDatasetEditors';

export interface DatasetDetailsProps {
  dataset: TableDataset;
}

export const DatasetDetails: FC<DatasetDetailsProps> = ({ dataset }) => {
  const [selectedVersion, setSelectedVersion] = useState(dataset.versions[0].version);

  const version = dataset.versions.find((version) => version.version === selectedVersion);

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <ManageDatasetEditors dataset={dataset} />
      </Grid>

      <Grid item xs={12}>
        <Typography gutterBottom component="h3" variant="h5">
          Version
        </Typography>
        <TextField
          fullWidth
          select
          label="Select a version to edit"
          size="small"
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(Number(e.target.value))}
        >
          {dataset.versions.map((version) => (
            <MenuItem key={version.version} value={version.version}>
              {`v${version.version}`}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12}>
        <Divider />
      </Grid>

      {version && (
        <Grid item xs={12}>
          <Labels datasetId={dataset.dataset_id} datasetVersion={version} />
        </Grid>
      )}
    </Grid>
  );
};
