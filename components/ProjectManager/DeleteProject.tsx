import React, { FC, useState } from 'react';

import { IconButton, Tooltip, Typography } from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

import { ModalWrapper } from '../ModalWrapper';

interface DeleteProjectProps {
  onClick: () => void;
}

export const DeleteProject: FC<DeleteProjectProps> = ({ onClick }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ModalWrapper
        title="Delete Project"
        submitText="Delete"
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={() => {
          onClick();
          setOpen(false);
        }}
      >
        <Typography variant="body1">
          Are you sure? <b>This cannot be undone</b>.
        </Typography>
      </ModalWrapper>
      <Tooltip arrow title="Delete selected project">
        <IconButton aria-label="Delete selected project">
          <DeleteForeverIcon onClick={() => setOpen(true)} />
        </IconButton>
      </Tooltip>
    </>
  );
};
