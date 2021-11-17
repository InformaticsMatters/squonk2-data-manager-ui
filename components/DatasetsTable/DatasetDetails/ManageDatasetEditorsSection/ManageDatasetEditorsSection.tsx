import { useState } from 'react';
import { useQueryClient } from 'react-query';

import type { DatasetSummary } from '@squonk/data-manager-client';
import {
  getGetDatasetsQueryKey,
  useAddEditorToDataset,
  useRemoveEditorFromDataset,
} from '@squonk/data-manager-client/dataset';

import { useKeycloakUser } from '../../../../hooks/useKeycloakUser';
import { CenterLoader } from '../../../CenterLoader';
import { ManageEditors } from './ManageEditors';

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
          await removeEditor({
            datasetid: dataset.dataset_id,
            userid: username,
          });
        }

        await queryClient.invalidateQueries(getGetDatasetsQueryKey());

        setIsLoading(false);
      }}
      onSelect={async (value) => {
        setIsLoading(true);
        const username = value.find((user) => !dataset.editors.includes(user));
        if (username !== undefined) {
          await addEditor({ datasetid: dataset.dataset_id, userid: username });
        }

        await queryClient.invalidateQueries(getGetDatasetsQueryKey());

        setIsLoading(false);
      }}
    />
  );
};
