import type { FC } from 'react';
import React, { useState } from 'react';

import { IconButton, Tooltip, Typography } from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

import { ModalWrapper } from '../Modals/ModalWrapper';

interface DeleteProjectProps {
  onClick: () => void;
}

export const DeleteProject: FC<DeleteProjectProps> = ({ onClick }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ModalWrapper
        id="delete-project"
        open={open}
        submitText="Delete"
        title="Delete Project"
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
        <IconButton aria-label="Delete selected project" onClick={() => setOpen(true)}>
          <DeleteForeverIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};
