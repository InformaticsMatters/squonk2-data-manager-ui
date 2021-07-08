import React, { FC, useState } from 'react';

import { useQueryClient } from 'react-query';

import { IconButton, Tooltip, Typography } from '@material-ui/core';
import DeleteOutlineRoundedIcon from '@material-ui/icons/DeleteOutlineRounded';
import { useDeleteFile } from '@squonk/data-manager-client/file';
import { getGetProjectQueryKey } from '@squonk/data-manager-client/project';

import { ModalWrapper } from '../Modals/ModalWrapper';

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
        id={`detach-dataset-${fileId}`}
        open={open}
        submitText="Detach"
        title="Detach File"
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
        <IconButton aria-label="Delete selected dataset" size="small" onClick={() => setOpen(true)}>
          <DeleteOutlineRoundedIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};
