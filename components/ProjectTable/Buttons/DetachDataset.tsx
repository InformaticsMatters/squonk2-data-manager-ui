import React from 'react';
import { useQueryClient } from 'react-query';

import { getGetFilesQueryKey, useDeleteFile } from '@squonk/data-manager-client/file';

import { IconButton } from '@material-ui/core';
import DeleteOutlineRoundedIcon from '@material-ui/icons/DeleteOutlineRounded';

import { WarningDeleteButton } from '../../WarningDeleteButton';

export interface DetachDatasetProps {
  /**
   * ID of a file.
   */
  fileId: string;
  /**
   * ID of the project.
   */
  projectId: string;
  /**
   * Path inside the project to the managed file.
   */
  path: string;
}

/**
 * Detach a managed file from a project
 */
export const DetachDataset = ({ fileId, projectId, path }: DetachDatasetProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: detachDataset } = useDeleteFile();

  return (
    <WarningDeleteButton
      modalId={`detach-dataset-${fileId}`}
      submitText="Detach"
      title="Detach File"
      tooltipText="Detach File"
      onDelete={async () => {
        await detachDataset({ fileid: fileId });
        await queryClient.invalidateQueries(getGetFilesQueryKey({ project_id: projectId, path }));
      }}
    >
      {({ openModal }) => (
        <IconButton aria-label="Delete selected dataset" size="small" onClick={openModal}>
          {/* We use the non-permanent delete icon here as a detach doesn't delete the source dataset */}
          <DeleteOutlineRoundedIcon />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
