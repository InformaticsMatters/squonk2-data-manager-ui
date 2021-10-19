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
import fileSize from 'filesize';

import { useKeycloakUser } from '../../../hooks/useKeycloakUser';
import { Labels } from '../../labels/Labels';
import { NewLabelButton } from '../../labels/NewLabelButton';
import { toLocalTimeString } from '../../LocalTime';
import { ModalWrapper } from '../../modals/ModalWrapper';
import type { TableDataset } from '../types';
import { AttachDatasetListItem } from './ListItems/AttachDatasetListItem';
import { DatasetSchemaListItem } from './ListItems/DatasetSchemaListItem';
import { DeleteDatasetListItem } from './ListItems/DeleteDatasetListItem';
import { NewVersionListItem } from './ListItems/NewVersionListItem';
import { ProjectsListItem } from './ListItems/ProjectsListItem';
import { VersionInfoListItem } from './ListItems/VersionInfoListItem';
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
      <Link component="button" variant="body1" onClick={() => setOpen(true)}>
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
          <Typography gutterBottom component="h3" variant="h2">
            Dataset Actions
          </Typography>

          {(isEditor || isOwner) && (
            <List>
              <NewVersionListItem dataset={dataset} edge="end" />
            </List>
          )}

          {(isEditor || isOwner) && (
            <Box marginBottom={2}>
              <Typography gutterBottom component="h4" variant="h3">
                Editors
              </Typography>
              <ManageDatasetEditors dataset={dataset} />
            </Box>
          )}

          <Typography gutterBottom component="h4" variant="h3">
            Working Version
          </Typography>
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
            <>
              <Typography gutterBottom component="h4" variant="h4">
                Labels{' '}
                <NewLabelButton
                  datasetId={dataset.dataset_id}
                  datasetVersion={selectedVersion.version}
                />
              </Typography>
              <Labels datasetId={dataset.dataset_id} datasetVersion={selectedVersion} />
            </>
          )}

          <Box marginY={2}>
            <Typography component="h4" variant="h4">
              Version Information
            </Typography>
            <List>
              <ProjectsListItem projectIds={selectedVersion?.projects} />
              <VersionInfoListItem
                name="Size"
                value={selectedVersion?.size ? fileSize(selectedVersion.size) : undefined}
              />
              <VersionInfoListItem
                name="Published date"
                value={
                  selectedVersion
                    ? toLocalTimeString(selectedVersion.published, true, true)
                    : undefined
                }
              />
            </List>
          </Box>

          {/* More complex actions requiring a new context */}
          <Box marginY={2}>
            <Typography component="h4" variant="h4">
              Version Actions
            </Typography>
            <List>
              {selectedVersion && (
                <AttachDatasetListItem datasetId={dataset.dataset_id} version={selectedVersion} />
              )}

              <DatasetSchemaListItem
                datasetId={dataset.dataset_id}
                version={selectedVersionNumber}
              />

              {selectedVersion && (isEditor || isOwner) && (
                <DeleteDatasetListItem
                  datasetId={dataset.dataset_id}
                  version={selectedVersion}
                  onDelete={() => {
                    // Reset selected version as it is being deleted
                    const nextSelectableVersions = dataset.versions.filter(
                      (version) => version.version !== selectedVersionNumber,
                    );
                    if (nextSelectableVersions.length > 0) {
                      setSelectedVersionNumber(nextSelectableVersions[0].version);
                    }
                  }}
                />
              )}
            </List>
          </Box>

          {/* DEBUG options. This allows access of dataset-id etc without leaving the UI */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <Typography component="h4" variant="h4">
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
