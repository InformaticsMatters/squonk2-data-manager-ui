import React from 'react';

import { useUser } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { IconButton, Popover, Tooltip, useTheme } from '@material-ui/core';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { UserMenuContent } from './UserMenuContent';

export const UserMenu = () => {
  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'user-menu',
  });

  const { isLoading } = useUser();

  const theme = useTheme();

  return (
    <>
      <Tooltip arrow title="User">
        <span>
          <IconButton color="inherit" disabled={isLoading} edge="end" {...bindTrigger(popupState)}>
            <AccountCircle />
          </IconButton>
        </span>
      </Tooltip>

      <Popover
        css={css`
          .MuiPopover-paper {
            padding: ${theme.spacing(1)}px;
          }
        `}
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <UserMenuContent />
      </Popover>
    </>
  );
};
