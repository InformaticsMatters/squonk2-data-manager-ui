import React, { FC, useState } from 'react';

import { DatasetVersionDetail } from '@squonk/data-manager-client';

import { IconButton, Link, Tooltip } from '@material-ui/core';
import GetAppRoundedIcon from '@material-ui/icons/GetAppRounded';

import { LocalTime } from '../../LocalTime/LocalTime';
import { ModalWrapper } from '../../Modals/ModalWrapper';
interface DownloadDatasetButtonProps {
  datasetId: string;
  versions: DatasetVersionDetail[];
}

export const DownloadDatasetButton: FC<DownloadDatasetButtonProps> = ({ datasetId, versions }) => {
  const [open, setOpen] = useState(false);

  const readyVersions = versions
    .filter((version) => version.processing_stage === 'DONE')
    .sort((a, b) => a.version - b.version);
  return (
    <>
      <Tooltip
        title={
          readyVersions.length
            ? 'Download versions of this dataset'
            : 'No versions are ready for download'
        }
      >
        <span>
          <IconButton disabled={!readyVersions.length} size="small" onClick={() => setOpen(true)}>
            <GetAppRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <ModalWrapper
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        id={`download-${datasetId}`}
        open={open}
        title="Datasets ready for download"
        onClose={() => setOpen(false)}
      >
        <ol>
          {readyVersions.map((version) => (
            <li key={version.version} value={version.version}>
              {version.file_name} — Published: <LocalTime utcTimestamp={version.published} /> —{' '}
              <Link
                download
                href={`/data-manager-ui/api/dm-api/dataset/${datasetId}/${version.version}`}
              >
                Download
              </Link>
            </li>
          ))}
        </ol>
      </ModalWrapper>
    </>
  );
};
