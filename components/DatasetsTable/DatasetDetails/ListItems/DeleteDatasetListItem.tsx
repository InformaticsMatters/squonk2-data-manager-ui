import React from 'react';
import { useQueryClient } from 'react-query';

import type { DatasetVersionSummary } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useDeleteDataset } from '@squonk/data-manager-client/dataset';

import { ListItem, ListItemSecondaryAction, ListItemText } from '@material-ui/core';
import { IconButton } from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

import { WarningDeleteButton } from '../../../WarningDeleteButton';

interface DeleteDatasetProps {
  datasetId: string;
  version: DatasetVersionSummary;
  resetSelection: () => void;
}

export const DeleteDatasetListItem = ({
  datasetId,
  version,
  resetSelection,
}: DeleteDatasetProps) => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteDataset();

  return (
    <WarningDeleteButton
      modalId={`delete-${datasetId}`}
      title={`Delete v${version.version}`}
      tooltipText="Delete versions of this dataset"
      onDelete={async () => {
        resetSelection();
        await deleteMutation.mutateAsync({ datasetid: datasetId, datasetversion: version.version });
        await queryClient.invalidateQueries(getGetDatasetsQueryKey());
      }}
    >
      {({ isDeleting, openModal }) => (
        <ListItem button disabled={isDeleting} onClick={openModal}>
          <ListItemText primary="Delete this Version of the Dataset" />
          <ListItemSecondaryAction>
            <IconButton
              aria-label="Delete selected dataset"
              disabled={isDeleting}
              edge="end"
              onClick={openModal}
            >
              <DeleteForeverIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )}
    </WarningDeleteButton>
  );
};
