import type { FC } from 'react';
import { useState } from 'react';
import React from 'react';

import {
  Box,
  Container,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import GetAppRoundedIcon from '@material-ui/icons/GetAppRounded';

import { useKeycloakUser } from '../../../hooks/useKeycloakUser';
import { ModalWrapper } from '../../Modals/ModalWrapper';
import { AttachDatasetButton } from '../Actions/Buttons/AttachDatasetButton';
import { DeleteDatasetButton } from '../Actions/Buttons/DeleteDatasetButton';
import { NewVersionButton } from '../Actions/Buttons/NewVersionButton';
import type { TableDataset } from '../types';
import { Labels } from './Labels';
import { ManageDatasetEditors } from './ManageDatasetEditors';

export interface DatasetDetailsProps {
  dataset: TableDataset;
}

export const DatasetDetails: FC<DatasetDetailsProps> = ({ dataset }) => {
  const [open, setOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(dataset.versions[0]);

  const { user } = useKeycloakUser();

  const isEditor = !!user.username && dataset.editors.includes(user.username);
  const isOwner = dataset.owner === user.username;

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
          {/* Display the download button next to the version select */}
          <Box alignItems="center" display="flex">
            {/* Main version selection - this controls the target version for this whole modal */}
            <TextField
              fullWidth
              select
              label="Select a version"
              size="small"
              value={selectedVersion.version}
              onChange={(event) => {
                const version = dataset.versions.find(
                  (version) => version.version === Number(event.target.value),
                );
                version && setSelectedVersion(version);
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
            <Tooltip title="Download this version of the dataset">
              <span>
                <IconButton
                  download
                  disabled={!(selectedVersion.processing_stage === 'DONE')} // Need the dataset to be downloadable
                  href={`/data-manager-ui/api/dm-api/dataset/${dataset.dataset_id}/${selectedVersion.version}`}
                  onClick={() => setOpen(true)}
                >
                  <GetAppRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Top level editing - operations that don't have a "submit" */}
          {(isEditor || isOwner) && (
            <>
              <Labels datasetId={dataset.dataset_id} datasetVersion={selectedVersion} />
              <ManageDatasetEditors dataset={dataset} />
            </>
          )}

          {/* More complex actions requiring a new context */}
          <Box marginY={2}>
            <Typography component="h3" variant="h6">
              Actions
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Attach Dataset to a Project"
                  secondary="Creates a file in the project linked to the selected version"
                />
                <ListItemSecondaryAction>
                  <AttachDatasetButton
                    datasetId={dataset.dataset_id}
                    edge="end"
                    fileName={dataset.fileName}
                    version={selectedVersion}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              {(isEditor || isOwner) && (
                <ListItem>
                  <ListItemText primary="Create a New Version of this Dataset" />
                  <ListItemSecondaryAction>
                    <NewVersionButton dataset={dataset} edge="end" />
                  </ListItemSecondaryAction>
                </ListItem>
              )}
              {(isEditor || isOwner) && (
                <ListItem>
                  <ListItemText primary="Delete this Version of the Dataset" />
                  <ListItemSecondaryAction>
                    <DeleteDatasetButton
                      datasetId={dataset.dataset_id}
                      edge="end"
                      version={selectedVersion}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              )}
            </List>
          </Box>
        </Container>
      </ModalWrapper>
    </>
  );
};
