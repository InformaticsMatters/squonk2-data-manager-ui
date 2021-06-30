import React, { FC, useState } from 'react';

import { useQueryClient } from 'react-query';

import { IconButton, Tooltip, Typography } from '@material-ui/core';
import DeleteOutlineRoundedIcon from '@material-ui/icons/DeleteOutlineRounded';
import { useDeleteFile } from '@squonk/data-manager-client/file';
import { getGetProjectQueryKey } from '@squonk/data-manager-client/project';

import { ModalWrapper } from '../ModalWrapper';

interface DetachDatasetProps {
  fileId: string;
  projectId: string;
}

export const DetachDataset: FC<DetachDatasetProps> = ({ fileId, projectId }) => {
  const queryClient = useQueryClient();
  const detachMutation = useDeleteFile();

  const [open, setOpen] = useState(false);
  return (
    <>
      <ModalWrapper
        title="Detach File"
        submitText="Detach"
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={async () => {
          await detachMutation.mutateAsync({ fileid: fileId });
          queryClient.invalidateQueries(getGetProjectQueryKey(projectId));
          setOpen(false);
        }}
      >
        <Typography variant="body1">
          Are you sure? <b>This cannot be undone</b>.
        </Typography>
      </ModalWrapper>
      <Tooltip title="Detach File">
        <IconButton size="small" aria-label="Delete selected dataset">
          <DeleteOutlineRoundedIcon onClick={() => setOpen(true)} />
        </IconButton>
      </Tooltip>
    </>
  );
};
