import React, { useState } from 'react';

import { IconButton } from '@material-ui/core';
import AccountTreeRoundedIcon from '@material-ui/icons/AccountTreeRounded';

import { useIsAuthorized } from '../../hooks/useIsAuthorized';
import { ModalWrapper } from '../modals/ModalWrapper';
import { ProjectManager } from '../ProjectManager';

export const ProjectModalButton = () => {
  const [open, setOpen] = useState(false);

  const isAuthorized = useIsAuthorized();

  return (
    <>
      <IconButton color="inherit" disabled={!isAuthorized} onClick={() => setOpen(true)}>
        <AccountTreeRoundedIcon />
      </IconButton>
      <ModalWrapper id="project-menu" open={open} title="Project" onClose={() => setOpen(false)}>
        <ProjectManager />
      </ModalWrapper>
    </>
  );
};
