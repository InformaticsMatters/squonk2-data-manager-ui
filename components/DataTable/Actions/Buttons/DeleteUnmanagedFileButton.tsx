import type { FC } from 'react';
import { useState } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import type { DeleteUnmanagedFileParams } from '@squonk/data-manager-client';
import { useDeleteUnmanagedFile } from '@squonk/data-manager-client/file';
import { getGetProjectQueryKey } from '@squonk/data-manager-client/project';

import { IconButton, Tooltip, Typography } from '@material-ui/core';
import DeleteForeverRoundedIcon from '@material-ui/icons/DeleteForeverRounded';

import { ModalWrapper } from '../../../Modals/ModalWrapper';

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
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutate: deleteFile } = useDeleteUnmanagedFile();
  return (
    <>
      <ModalWrapper
        id={`delete-file-${path}-${fileName}`}
        open={open}
        submitText="Delete"
        title="Delete unmanaged file"
        onClose={() => setOpen(false)}
        onSubmit={() => {
          deleteFile(
            {
              params: {
                file: fileName,
                path,
                project_id: projectId,
              },
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries(getGetProjectQueryKey(projectId));
                setOpen(false);
              },
            },
          );
        }}
      >
        <Typography variant="body1">
          Are you sure? <b>This cannot be undone</b>.
        </Typography>
      </ModalWrapper>
      <Tooltip title="Delete unmanaged file">
        <IconButton
          aria-label="Delete this unmanaged file"
          size="small"
          onClick={() => setOpen(true)}
        >
          <DeleteForeverRoundedIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};
