import type { DatasetVersionSummary, DmError } from "@squonk/data-manager-client";
import { getGetDatasetsQueryKey, useDeleteDataset } from "@squonk/data-manager-client/dataset";

import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { ListItemButton, ListItemText } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { WarningDeleteButton } from "../../../../components/WarningDeleteButton";
import { useEnqueueError } from "../../../../hooks/useEnqueueStackError";

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
        await queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() });
        enqueueSnackbar("Dataset deleted", { variant: "success" });
      }}
    >
      {({ isDeleting, openModal }) => (
        <ListItemButton disabled={isDeleting} onClick={openModal}>
          <ListItemText primary="Delete this Version of the Dataset" />
          <DeleteForeverIcon color="action" />
        </ListItemButton>
      )}
    </WarningDeleteButton>
  );
};
