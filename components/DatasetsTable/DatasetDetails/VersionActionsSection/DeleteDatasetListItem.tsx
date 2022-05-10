import { useQueryClient } from 'react-query';

import type { DatasetVersionSummary, DmError } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useDeleteDataset } from '@squonk/data-manager-client/dataset';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { ListItem, ListItemText } from '@mui/material';

import { useEnqueueError } from '../../../../hooks/useEnqueueStackError';
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
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  return (
    <WarningDeleteButton
      modalId={`delete-${datasetId}`}
      title={`Delete v${version.version}`}
      onDelete={async () => {
        onDelete();
        try {
          await deleteDataset({ datasetId, datasetVersion: version.version });
        } catch (error) {
          enqueueError(error);
        }
        await queryClient.invalidateQueries(getGetDatasetsQueryKey());
        enqueueSnackbar('Dataset deleted', { variant: 'success' });
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
