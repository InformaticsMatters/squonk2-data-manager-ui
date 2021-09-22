import type { FC } from 'react';
import { useState } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import {
  getGetDatasetsQueryKey,
  useAddEditorToDataset,
  useRemoveEditorFromDataset,
} from '@squonk/data-manager-client/dataset';

import { useKeycloakUser } from '../../../hooks/useKeycloakUser';
import { CenterLoader } from '../../CenterLoader';
import { ManageEditors } from '../../ManageEditors';
import type { TableDataset } from '../types';

export interface ManageDatasetEditorsProps {
  dataset: TableDataset;
}

export const ManageDatasetEditors: FC<ManageDatasetEditorsProps> = ({ dataset }) => {
  const { user } = useKeycloakUser();

  const queryClient = useQueryClient();
  const { mutateAsync: addEditor } = useAddEditorToDataset();
  const { mutateAsync: removeEditor } = useRemoveEditorFromDataset();

  // Get all users except for the current user - this is added manually
  const editors = dataset.editors.filter((editor) => editor !== user.username);

  const [isLoading, setIsLoading] = useState(false);

  return user.username ? (
    <ManageEditors
      currentUsername={user.username}
      editorsValue={editors}
      isLoading={isLoading}
      onRemove={async (value) => {
        setIsLoading(true);
        const username = dataset.editors.find((editor) => !value.includes(editor));
        username &&
          (await removeEditor({
            datasetid: dataset.dataset_id,
            userid: username,
          }));

        await queryClient.invalidateQueries(getGetDatasetsQueryKey());

        setIsLoading(false);
      }}
      onSelect={async (value) => {
        setIsLoading(true);
        const username = value.find((user) => !dataset.editors.includes(user));
        username && (await addEditor({ datasetid: dataset.dataset_id, userid: username }));

        await queryClient.invalidateQueries(getGetDatasetsQueryKey());

        setIsLoading(false);
      }}
    />
  ) : (
    <CenterLoader />
  );
};
