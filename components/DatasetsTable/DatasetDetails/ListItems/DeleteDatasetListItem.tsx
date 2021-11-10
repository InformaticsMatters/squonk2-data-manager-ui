import React from 'react';
import { useQueryClient } from 'react-query';

import type { DatasetVersionSummary } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useDeleteDataset } from '@squonk/data-manager-client/dataset';

import { ListItem, ListItemText } from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

import { WarningDeleteButton } from '../../../WarningDeleteButton';

export interface DeleteDatasetProps {
  /**
   * ID of the dataset to delete
   */
  datasetId: string;
  /**
   * version of the dataset to delete
   */
  version: DatasetVersionSummary;
  /**
   * Called just before the async delete action is called. Used to reset state in the parent scope.
   * E.g. resetting the selected version.
   */
  onDelete: () => void;
}

/**
 * MuiListItem with an action that opens a modal with a confirmation to delete a dataset.
 */
export const DeleteDatasetListItem = ({ datasetId, version, onDelete }: DeleteDatasetProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteDataset } = useDeleteDataset();

  return (
    <WarningDeleteButton
      modalId={`delete-${datasetId}`}
      title={`Delete v${version.version}`}
      tooltipText="Delete versions of this dataset"
      onDelete={async () => {
        onDelete();
        await deleteDataset({ datasetid: datasetId, datasetversion: version.version });
        await queryClient.invalidateQueries(getGetDatasetsQueryKey());
      }}
    >
      {({ isDeleting, openModal }) => (
        <ListItem button disabled={isDeleting} onClick={openModal}>
          <ListItemText primary="Delete this Version of the Dataset" />
          <DeleteForeverIcon color="action" />
        </ListItem>
      )}
    </WarningDeleteButton>
  );
};
