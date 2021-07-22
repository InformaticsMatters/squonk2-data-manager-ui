import type { FC } from 'react';
import React from 'react';

import { useUser } from '@auth0/nextjs-auth0';

import { AttachButton } from './Actions/AttachButton';
import { DeleteDataset } from './Actions/DeleteDataset';
import { DownloadDatasetButton } from './Actions/DownloadDatasetButton';
import { NewVersionButton } from './Actions/NewVersionButton';
import type { TableDataset } from './types';

interface DatasetActionsProps {
  dataset: TableDataset;
}

export const DatasetActions: FC<DatasetActionsProps> = ({ dataset }) => {
  const { user } = useUser();

  return (
    <>
      <DownloadDatasetButton datasetId={dataset.dataset_id} versions={dataset.versions} />
      <AttachButton
        datasetId={dataset.dataset_id}
        fileName={dataset.fileName}
        versions={dataset.versions}
      />
      {user?.preferred_username &&
        (dataset.editors.includes(user.preferred_username as string) ||
          dataset.owner === user.preferred_username) && (
          <DeleteDataset datasetId={dataset.dataset_id} versions={dataset.versions} />
        )}
      {user?.preferred_username &&
        (dataset.editors.includes(user.preferred_username as string) ||
          dataset.owner === user.preferred_username) && <NewVersionButton dataset={dataset} />}
    </>
  );
};
