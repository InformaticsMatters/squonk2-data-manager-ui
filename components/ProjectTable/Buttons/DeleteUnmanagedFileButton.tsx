import type { FC } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import type { DeleteUnmanagedFileParams } from '@squonk/data-manager-client';
import { useDeleteUnmanagedFile } from '@squonk/data-manager-client/file';
import { getGetProjectQueryKey } from '@squonk/data-manager-client/project';

import { IconButton } from '@material-ui/core';
import DeleteForeverRoundedIcon from '@material-ui/icons/DeleteForeverRounded';

import { WarningDeleteButton } from '../../WarningDeleteButton';

interface DeleteUnmanagedFileButtonProps {
  projectId: DeleteUnmanagedFileParams['project_id'];
  path: DeleteUnmanagedFileParams['path'];
  fileName: DeleteUnmanagedFileParams['file'];
}

export const DeleteUnmanagedFileButton: FC<DeleteUnmanagedFileButtonProps> = ({
  projectId,
  path,
  fileName,
}) => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteFile } = useDeleteUnmanagedFile();

  return (
    <WarningDeleteButton
      modalId={`delete-file-${path}-${fileName}`}
      submitText="Delete"
      title="Delete unmanaged file"
      tooltipText="Delete unmanaged file"
      onDelete={async () => {
        await deleteFile({
          params: {
            file: fileName,
            path,
            project_id: projectId,
          },
        });
        await queryClient.invalidateQueries(getGetProjectQueryKey(projectId));
      }}
    >
      {({ openModal }) => (
        <IconButton aria-label="Delete this unmanaged file" size="small" onClick={openModal}>
          <DeleteForeverRoundedIcon />
        </IconButton>
      )}
    </WarningDeleteButton>
  );
};
