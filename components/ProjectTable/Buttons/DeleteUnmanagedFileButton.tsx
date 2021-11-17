import { useQueryClient } from 'react-query';

import type { DeleteUnmanagedFileParams } from '@squonk/data-manager-client';
import { getGetFilesQueryKey, useDeleteUnmanagedFile } from '@squonk/data-manager-client/file';

import { IconButton } from '@material-ui/core';
import DeleteForeverRoundedIcon from '@material-ui/icons/DeleteForeverRounded';

import { WarningDeleteButton } from '../../WarningDeleteButton';

export interface DeleteUnmanagedFileButtonProps {
  /**
   * ID of the project containing the unmanaged file
   */
  projectId: DeleteUnmanagedFileParams['project_id'];
  /**
   * Path inside the project to the unmanaged file
   */
  path: DeleteUnmanagedFileParams['path'];
  /**
   * Name of the unmanaged file
   */
  fileName: DeleteUnmanagedFileParams['file'];
}

/**
 * Action to delete an unmanaged file from a project
 */
export const DeleteUnmanagedFileButton = ({
  projectId,
  path,
  fileName,
}: DeleteUnmanagedFileButtonProps) => {
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
        await queryClient.invalidateQueries(getGetFilesQueryKey({ project_id: projectId, path }));
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
