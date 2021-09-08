import type { FC } from 'react';
import { useState } from 'react';
import React from 'react';

import { css } from '@emotion/react';
import {
  Box,
  Container,
  IconButton,
  Link,
  List,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import GetAppRoundedIcon from '@material-ui/icons/GetAppRounded';

import { useKeycloakUser } from '../../../hooks/useKeycloakUser';
import { ModalWrapper } from '../../Modals/ModalWrapper';
import { AttachDatasetButton } from '../Actions/Buttons/AttachDatasetButton';
import { DeleteDatasetButton } from '../Actions/Buttons/DeleteDatasetButton';
import { NewVersionButton } from '../Actions/Buttons/NewVersionButton';
import type { TableDataset } from '../types';
import { DatasetSchemaListItem } from './DatasetSchemaListItem';
import { Labels } from './Labels';
import { ManageDatasetEditors } from './ManageDatasetEditors';

export interface DatasetDetailsProps {
  dataset: TableDataset;
}

export const DatasetDetails: FC<DatasetDetailsProps> = ({ dataset }) => {
  const [open, setOpen] = useState(false);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(dataset.versions[0].version);

  const selectedVersion = dataset.versions.find(
    (version) => version.version === selectedVersionNumber,
  );

  const { user } = useKeycloakUser();

  const isEditor = !!user.username && dataset.editors.includes(user.username);
  const isOwner = dataset.owner === user.username;

  const theme = useTheme();

  return (
    <>
      <Link component="button" variant="body2" onClick={() => setOpen(true)}>
        {dataset.fileName}
      </Link>
      <ModalWrapper
        DialogProps={{ fullScreen: true }}
        id={`${dataset.dataset_id}-details`}
        open={open}
        title={`Dataset ${dataset.fileName}`}
        onClose={() => setOpen(false)}
      >
        <Container maxWidth="md">
          <Typography gutterBottom component="h3" variant="h5">
            Dataset Actions
          </Typography>

          {(isEditor || isOwner) && (
            <List>
              <NewVersionButton dataset={dataset} edge="end" />
            </List>
          )}

          {(isEditor || isOwner) && (
            <Box marginBottom={2}>
              <ManageDatasetEditors dataset={dataset} />
            </Box>
          )}

          <Typography component="h4" variant="h6">
            Working Version
          </Typography>
          <Typography gutterBottom variant="body2">
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
              value={selectedVersionNumber}
              onChange={(event) => {
                const version = dataset.versions.find(
                  (version) => version.version === Number(event.target.value),
                );
                version && setSelectedVersionNumber(version.version);
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
              <Tooltip title="Download this version of the dataset">
                <span>
                  <IconButton
                    download
                    disabled={!(selectedVersion?.processing_stage === 'DONE')} // Need the dataset to be downloadable
                    href={`/data-manager-ui/api/dm-api/dataset/${dataset.dataset_id}/${selectedVersionNumber}`}
                    onClick={() => setOpen(true)}
                  >
                    <GetAppRoundedIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </div>
          </Box>

          {/* Top level editing - operations that don't have a "submit" */}
          {selectedVersion !== undefined && (isEditor || isOwner) && (
            <Labels datasetId={dataset.dataset_id} datasetVersion={selectedVersion} />
          )}

          {/* More complex actions requiring a new context */}
          <Box marginY={2}>
            <Typography component="h4" variant="subtitle1">
              Version Actions
            </Typography>
            <List>
              {selectedVersion && (
                <AttachDatasetButton
                  datasetId={dataset.dataset_id}
                  fileName={dataset.fileName}
                  version={selectedVersion}
                />
              )}

              <DatasetSchemaListItem
                datasetId={dataset.dataset_id}
                version={selectedVersionNumber}
              />

              {selectedVersion && (isEditor || isOwner) && (
                <DeleteDatasetButton
                  datasetId={dataset.dataset_id}
                  resetSelection={() => {
                    const nextSelectableVersions = dataset.versions.filter(
                      (version) => version.version !== selectedVersionNumber,
                    );
                    if (nextSelectableVersions.length > 0) {
                      setSelectedVersionNumber(nextSelectableVersions[0].version);
                    }
                  }}
                  version={selectedVersion}
                />
              )}
            </List>
          </Box>

          {process.env.NODE_ENV === 'development' && (
            <>
              <Typography component="h4" variant="subtitle1">
                Technical Information
              </Typography>
              <pre>{JSON.stringify(dataset, null, 2)}</pre>
            </>
          )}
        </Container>
      </ModalWrapper>
    </>
  );
};
