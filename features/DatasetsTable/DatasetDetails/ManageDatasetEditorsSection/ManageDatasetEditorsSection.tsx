import { useState } from "react";
import { useQueryClient } from "react-query";

import type { DatasetSummary, DmError } from "@squonk/data-manager-client";
import {
  getGetDatasetsQueryKey,
  useAddEditorToDataset,
  useRemoveEditorFromDataset,
} from "@squonk/data-manager-client/dataset";

import { CenterLoader } from "../../../../components/CenterLoader";
import { useEnqueueError } from "../../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../../hooks/useKeycloakUser";
import { ManageEditors } from "./ManageEditors";

export interface ManageDatasetEditorsSectionProps {
  /**
   * Dataset from datasets table
   */
  dataset: DatasetSummary;
}

/**
 * MuiAutocomplete with options to add and remove editors from a dataset
 */
export const ManageDatasetEditorsSection = ({ dataset }: ManageDatasetEditorsSectionProps) => {
  const { user } = useKeycloakUser();

  const queryClient = useQueryClient();
  const { mutateAsync: addEditor } = useAddEditorToDataset();
  const { mutateAsync: removeEditor } = useRemoveEditorFromDataset();

  // Get all users except for the current user - this is added manually
  const editors = dataset.editors.filter((editor) => editor !== user.username);

  const [isLoading, setIsLoading] = useState(false);

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  if (!user.username) {
    return <CenterLoader />;
  }

  return (
    <ManageEditors
      currentUsername={user.username}
      editorsValue={editors}
      isLoading={isLoading}
      onRemove={async (value) => {
        setIsLoading(true);
        const username = dataset.editors.find((editor) => !value.includes(editor));
        if (username !== undefined) {
          try {
            await removeEditor({
              datasetId: dataset.dataset_id,
              userId: username,
            });
          } catch (error) {
            enqueueError(error);
          }
        } else {
          enqueueSnackbar("Username doesn't exist", { variant: "warning" });
        }

        await queryClient.invalidateQueries(getGetDatasetsQueryKey());
        enqueueSnackbar(`User ${username} removed successfully`, { variant: "success" });

        setIsLoading(false);
      }}
      onSelect={async (value) => {
        setIsLoading(true);
        const username = value.find((user) => !dataset.editors.includes(user));
        if (username !== undefined) {
          try {
            await addEditor({ datasetId: dataset.dataset_id, userId: username });
          } catch (error) {
            enqueueError(error);
          }
        } else {
          enqueueSnackbar("Username doesn't exist", { variant: "warning" });
        }

        await queryClient.invalidateQueries(getGetDatasetsQueryKey());
        enqueueSnackbar(`User ${username} added successfully`, { variant: "success" });

        setIsLoading(false);
      }}
    />
  );
};
