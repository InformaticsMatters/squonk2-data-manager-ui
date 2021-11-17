import { css } from '@emotion/react';
import { IconButton, Popover, Tooltip, useTheme } from '@material-ui/core';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { useKeycloakUser } from '../../hooks/useKeycloakUser';
import { UserMenuContent } from './UserMenuContent';

/**
 * Popover displaying the user menu options
 */
export const UserMenu = () => {
  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'user-menu',
  });

  const { isLoading } = useKeycloakUser();

  const theme = useTheme();

  return (
    <>
      <Tooltip title="User">
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
