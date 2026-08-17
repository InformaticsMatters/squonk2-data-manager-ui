import { type DatasetVersionSummary, type DmError } from "@/api/data-manager";

import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { ListItemButton, ListItemText } from "@mui/material";

import { WarningDeleteButton } from "../../../../components/WarningDeleteButton";
import { type DatasetCapability } from "../../../../datasets/capabilities";
import {
  type DatasetDeletionDestination,
  datasetMutationFailureMessage,
} from "../../../../datasets/mutations";
import { useDatasetCommands } from "../../../../datasets/useDatasetCommands";
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
   * Called after deletion with a destination derived from refreshed dataset data.
   */
  onDeleted: (next: DatasetDeletionDestination) => void;
  capability: DatasetCapability;
}

/**
 * MuiListItem with an action that opens a modal with a confirmation to delete a dataset.
 */
export const DeleteDatasetListItem = ({
  datasetId,
  version,
  onDeleted,
  capability,
}: DeleteDatasetProps) => {
  const { deleteVersion } = useDatasetCommands();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  return (
    <WarningDeleteButton
      retainOnError
      modalId={`delete-${datasetId}`}
      title={`Delete v${version.version}`}
      tooltipText={capability.status === "disabled" ? capability.reason : undefined}
      onDelete={async () => {
        try {
          const { nextVersion } = await deleteVersion(datasetId, version.version);
          enqueueSnackbar("Dataset version deleted", { variant: "success" });
          onDeleted(nextVersion);
        } catch (error) {
          const message = datasetMutationFailureMessage(
            error,
            "delete",
            datasetId,
            version.version,
          );
          message ? enqueueSnackbar(message, { variant: "error" }) : enqueueError(error);
          throw error;
        }
      }}
    >
      {({ isDeleting, openModal }) => (
        <ListItemButton
          disabled={isDeleting || capability.status !== "enabled"}
          onClick={openModal}
        >
          <ListItemText primary="Delete this Version of the Dataset" />
          <DeleteForeverIcon color="action" />
        </ListItemButton>
      )}
    </WarningDeleteButton>
  );
};
