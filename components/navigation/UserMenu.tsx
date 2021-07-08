import React from 'react';

import { useUser } from '@auth0/nextjs-auth0';
import { IconButton, Popover, Tooltip, Typography } from '@material-ui/core';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import Link from 'next/link';

export const UserMenu = () => {
  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'user-menu',
  });

  const { user, isLoading } = useUser();

  return (
    <>
      <Tooltip arrow title="User">
        <>
          <IconButton color="inherit" disabled={isLoading} edge="end" {...bindTrigger(popupState)}>
            <AccountCircle />
          </IconButton>
        </>
      </Tooltip>

      <Popover
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
        <Typography variant="h6">Account</Typography>
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : user ? (
          <Typography>
            {user.preferred_username} / <Link href="/api/auth/logout">Logout</Link>
          </Typography>
        ) : (
          <Typography>
            <Link href="/api/auth/login">Login</Link>
          </Typography>
        )}
      </Popover>
    </>
  );
};
