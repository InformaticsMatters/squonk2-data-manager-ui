import type { DatasetSummary, DatasetVersionSummary } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import { Box, MenuItem, TextField, Typography, useTheme } from '@material-ui/core';

import { DownloadButton } from '../../DownloadButton';
import { Labels } from '../../labels/Labels';
import { NewLabelButton } from '../../labels/NewLabelButton';

export interface WorkingVersionSectionProps {
  /**
   * A dataset `version` belongs to.
   */
  dataset: DatasetSummary;
  /**
   * A selected dataset version.
   */
  version: DatasetVersionSummary;
  /**
   * Setter to set the selected version.
   */
  setVersion: (version: DatasetVersionSummary) => void;
  /**
   * Whether the dataset version is editable.
   */
  editable: boolean;
}

/**
 * Displays 'Working Version' section in Dataset Details.
 */
export const WorkingVersionSection = ({
  dataset,
  version,
  setVersion,
  editable,
}: WorkingVersionSectionProps) => {
  const theme = useTheme();

  return (
    <>
      <Typography gutterBottom variant="body1">
        The options below affect this version
      </Typography>
      {/* Display the download button next to the version select */}
      <Box alignItems="center" display="flex" marginY={1}>
        {/* Main version selection - this controls the target version for this whole modal */}
        <TextField
          fullWidth
          select
          label="Select a version"
          size="medium"
          value={version.version}
          onChange={(event) => {
            const version = dataset.versions.find(
              (version) => version.version === Number(event.target.value),
            );
            version && setVersion(version);
          }}
        >
          {dataset.versions.map((version) => (
            <MenuItem
              key={version.version}
              value={version.version}
            >{`v${version.version}`}</MenuItem>
          ))}
        </TextField>

        {/* Download Dataset Version */}
        <div
          css={css`
            margin-left: ${theme.spacing(2)}px;
          `}
        >
          <DownloadButton
            disabled={!(version.processing_stage === 'DONE')}
            href={`/data-manager-ui/api/dm-api/dataset/${dataset.dataset_id}/${version.version}`} // Need the dataset to be downloadable
            tooltip="Download this version of the dataset"
          />
        </div>
      </Box>
      {/* Top level editing - operations that don't have a "submit" */}
      {editable && (
        <>
          <Typography gutterBottom component="h4" variant="h5">
            Labels{' '}
            <NewLabelButton datasetId={dataset.dataset_id} datasetVersion={version.version} />
          </Typography>
          <Labels datasetId={dataset.dataset_id} datasetVersion={version} />
        </>
      )}
    </>
  );
};
