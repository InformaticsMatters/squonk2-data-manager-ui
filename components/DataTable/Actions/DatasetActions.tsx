import type { FC } from 'react';
import React from 'react';

import { useUser } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';

import type { TableDataset } from '../types';
import { AttachDatasetButton } from './Buttons/AttachDatasetButton';
import { DeleteDatasetButton } from './Buttons/DeleteDatasetButton';
import { DownloadDatasetButton } from './Buttons/DownloadDatasetButton';
import { EditDatasetButton } from './Buttons/EditDatasetButton';
import { NewVersionButton } from './Buttons/NewVersionButton';

export interface DatasetActionsProps {
  dataset: TableDataset;
}

export const DatasetActions: FC<DatasetActionsProps> = ({ dataset }) => {
  const { user } = useUser();

  return (
    <div
      css={css`
        white-space: nowrap;
      `}
    >
      <DownloadDatasetButton datasetId={dataset.dataset_id} versions={dataset.versions} />
      <AttachDatasetButton
        datasetId={dataset.dataset_id}
        fileName={dataset.fileName}
        versions={dataset.versions}
      />
      {user?.preferred_username &&
        (dataset.editors.includes(user.preferred_username as string) ||
          dataset.owner === user.preferred_username) && <EditDatasetButton dataset={dataset} />}
      {user?.preferred_username &&
        (dataset.editors.includes(user.preferred_username as string) ||
          dataset.owner === user.preferred_username) && (
          <DeleteDatasetButton datasetId={dataset.dataset_id} versions={dataset.versions} />
        )}
      {user?.preferred_username &&
        (dataset.editors.includes(user.preferred_username as string) ||
          dataset.owner === user.preferred_username) && <NewVersionButton dataset={dataset} />}
    </div>
  );
};
