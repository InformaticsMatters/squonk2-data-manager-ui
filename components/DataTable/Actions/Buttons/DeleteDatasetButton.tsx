import type { FC } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import type { DatasetVersionSummary } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useDeleteDataset } from '@squonk/data-manager-client/dataset';

import type { IconButtonProps } from '@material-ui/core';
import { IconButton } from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

import { WarningDeleteButton } from '../../../WarningDeleteButton';

interface DeleteDatasetProps extends IconButtonProps {
  datasetId: string;
  version: DatasetVersionSummary;
}

export const DeleteDatasetButton: FC<DeleteDatasetProps> = ({
  datasetId,
  version,
  ...buttonProps
}) => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteDataset();

  return (
    <WarningDeleteButton
      modalId={`delete-${datasetId}`}
      title={`Delete v${version.version}`}
      tooltipText="Delete versions of this dataset"
      onDelete={async () => {
        await deleteMutation.mutateAsync({ datasetid: datasetId, datasetversion: version.version });
        queryClient.invalidateQueries(getGetDatasetsQueryKey());
      }}
    >
      {({ isDeleting, openModal }) => (
        <IconButton
          {...buttonProps}
          aria-label="Delete selected dataset"
          disabled={isDeleting}
          onClick={openModal}
        >
          <DeleteForeverIcon />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
