import { useState } from 'react';

import { css } from '@emotion/react';
import { IconButton } from '@material-ui/core';
import AccountTreeRoundedIcon from '@material-ui/icons/AccountTreeRounded';

import { useIsAuthorized } from '../../hooks/useIsAuthorized';
import { ModalWrapper } from '../modals/ModalWrapper';
import { CurrentContext } from './CurrentContext';

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

      <ModalWrapper id="project-menu" open={open} title="Context" onClose={() => setOpen(false)}>
        <div
          css={css`
            min-width: 200px;
          `}
        >
          <CurrentContext />
        </div>
      </ModalWrapper>
    </>
  );
};
