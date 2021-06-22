import React, { FC, useState } from 'react';

import { useQueryClient } from 'react-query';

import { IconButton, Tooltip, Typography } from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { getGetAvailableDatasetsQueryKey, useDeleteDataset } from '@squonk/data-manager-client';

import { ModalWrapper } from '../ModalWrapper';

interface DeleteDatasetProps {
  datasetId: string;
}

export const DeleteDataset: FC<DeleteDatasetProps> = ({ datasetId }) => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteDataset();

  const [open, setOpen] = useState(false);
  return (
    <>
      <ModalWrapper
        title="Delete Dataset"
        submitText="Delete"
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={async () => {
          await deleteMutation.mutateAsync({ datasetid: datasetId });
          queryClient.invalidateQueries(getGetAvailableDatasetsQueryKey());
          setOpen(false);
        }}
      >
        <Typography variant="body1">
          Are you sure? <b>This cannot be undone</b>.
        </Typography>
      </ModalWrapper>
      <Tooltip arrow title="Delete selected dataset">
        <IconButton size="small" aria-label="Delete selected dataset">
          <DeleteForeverIcon onClick={() => setOpen(true)} />
        </IconButton>
      </Tooltip>
    </>
  );
};
