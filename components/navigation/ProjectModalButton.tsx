import React, { useState } from 'react';

import { IconButton } from '@material-ui/core';
import AccountTreeRoundedIcon from '@material-ui/icons/AccountTreeRounded';
import dynamic from 'next/dynamic';

import { useIsAuthorized } from '../../hooks/useIsAuthorized';
import { CenterLoader } from '../CenterLoader';
import { ModalWrapper } from '../modals/ModalWrapper';
import type { ProjectManagerProps } from '../ProjectManager';

const ProjectManager = dynamic<ProjectManagerProps>(
  () => import('../ProjectManager').then((mod) => mod.ProjectManager),
  {
    loading: () => <CenterLoader />,
  },
);

/**
 * Button controlling a modal that displays the project management options
 */
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
