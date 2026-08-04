import { useState } from "react";

import { type DatasetSummary, type DatasetVersionSummary, type DmError } from "@/api/data-manager";

import { ManageUsers } from "../../../../components/ManageUsers";
import { type DatasetCapability } from "../../../../datasets/capabilities";
import { datasetMutationFailureMessage } from "../../../../datasets/mutations";
import { useDatasetCommands } from "../../../../datasets/useDatasetCommands";
import { useEnqueueError } from "../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../hooks/useKeycloakUser";

export interface ManageDatasetEditorsSectionProps {
  /**
   * Dataset from datasets table
   */
  dataset: DatasetSummary;
  version: DatasetVersionSummary;
  capability: DatasetCapability;
}

/**
 * MuiAutocomplete with options to add and remove editors from a dataset
 */
export const ManageDatasetEditorsSection = ({
  dataset,
  version,
  capability,
}: ManageDatasetEditorsSectionProps) => {
  const { user } = useKeycloakUser();
  const commands = useDatasetCommands();

  // Get all users except for the current user - this is added manually
  const editors = dataset.editors.filter((editor) => editor !== user.username);

  const [isLoading, setIsLoading] = useState(false);

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  return (
    <ManageUsers
      disabled={capability.status !== "enabled"}
      helperText={capability.status === "hidden" ? undefined : capability.reason}
      isLoading={isLoading}
      title="Editors"
      users={editors}
      onRemove={async (_, changedUser) => {
        setIsLoading(true);
        const username = changedUser;
        if (username === undefined) {
          enqueueSnackbar("Username doesn't exist", { variant: "warning" });
        } else {
          try {
            await commands.removeEditor(dataset.dataset_id, username);
            enqueueSnackbar(`User ${username} removed successfully`, { variant: "success" });
          } catch (error) {
            const message = datasetMutationFailureMessage(
              error,
              "manage editors for",
              dataset.dataset_id,
              version.version,
            );
            message ? enqueueSnackbar(message, { variant: "error" }) : enqueueError(error);
          }
        }

        setIsLoading(false);
      }}
      onSelect={async (_, changedUser) => {
        setIsLoading(true);
        const username = changedUser;
        if (username === undefined) {
          enqueueSnackbar("Username doesn't exist", { variant: "warning" });
        } else {
          try {
            await commands.addEditor(dataset.dataset_id, username);
            enqueueSnackbar(`User ${username} added successfully`, { variant: "success" });
          } catch (error) {
            const message = datasetMutationFailureMessage(
              error,
              "manage editors for",
              dataset.dataset_id,
              version.version,
            );
            message ? enqueueSnackbar(message, { variant: "error" }) : enqueueError(error);
          }
        }

        setIsLoading(false);
      }}
    />
  );
};
