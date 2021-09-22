import type { FC } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import { useDeleteFile } from '@squonk/data-manager-client/file';
import { getGetProjectQueryKey } from '@squonk/data-manager-client/project';

import { IconButton } from '@material-ui/core';
import DeleteOutlineRoundedIcon from '@material-ui/icons/DeleteOutlineRounded';

import { WarningDeleteButton } from '../../WarningDeleteButton';

interface DetachDatasetProps {
  fileId: string;
  projectId: string;
}

export const DetachDataset: FC<DetachDatasetProps> = ({ fileId, projectId }) => {
  const queryClient = useQueryClient();
  const detachMutation = useDeleteFile();

  return (
    <WarningDeleteButton
      modalId={`detach-dataset-${fileId}`}
      submitText="Detach"
      title="Detach File"
      tooltipText="Detach File"
      onDelete={async () => {
        await detachMutation.mutateAsync({ fileid: fileId });
        await queryClient.invalidateQueries(getGetProjectQueryKey(projectId));
      }}
    >
      {({ openModal }) => (
        <IconButton aria-label="Delete selected dataset" size="small" onClick={openModal}>
          <DeleteOutlineRoundedIcon />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
