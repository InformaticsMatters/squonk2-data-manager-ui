import { useState } from 'react';

import { css } from '@emotion/react';
import {
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import MenuRoundedIcon from '@material-ui/icons/MenuRounded';

import { useIsAuthorized } from '../../hooks/useIsAuthorized';
import { ModalWrapper } from '../modals/ModalWrapper';
import { CurrentContext } from './CurrentContext';
import { NavLink } from './NavLink';
import { UserMenuContent } from './UserMenuContent';

/**
 * Mobile modal navigation menu with
 * * Page links
 * * Project management
 * * User menu
 */
export const MobileNavMenu = () => {
  const [open, setOpen] = useState(false);
  const isAuthorized = useIsAuthorized();

  return (
    <>
      <IconButton
        color="inherit"
        css={css`
          margin-left: auto;
        `}
        onClick={() => setOpen(true)}
      >
        <MenuRoundedIcon />
      </IconButton>
      <ModalWrapper id="mobile-menu" open={open} title="" onClose={() => setOpen(false)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography component="h3" variant="h6">
              Links
            </Typography>
            <List aria-label="main-mobile-navigation" component="nav">
              <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Datasets">
                {({ active }) => (
                  <ListItem button component="a" selected={active}>
                    <ListItemText primary="Datasets" />
                  </ListItem>
                )}
              </NavLink>
              <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Project">
                {({ active }) => (
                  <ListItem button component="a" selected={active}>
                    <ListItemText primary="Project" />
                  </ListItem>
                )}
              </NavLink>
              <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Executions">
                {({ active }) => (
                  <ListItem button component="a" selected={active}>
                    <ListItemText primary="Executions" />
                  </ListItem>
                )}
              </NavLink>
              <NavLink stripQueryParameters={['taskId', 'instanceId', 'path']} title="Results">
                {({ active }) => (
                  <ListItem button component="a" selected={active}>
                    <ListItemText primary="Results" />
                  </ListItem>
                )}
              </NavLink>
            </List>
          </Grid>

          {isAuthorized && (
            <Grid item xs={12}>
              <Divider />
            </Grid>
          )}

          <Grid item xs={12}>
            {isAuthorized && (
              <>
                <Typography gutterBottom variant="h3">
                  Project
                </Typography>
                <CurrentContext />
              </>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <UserMenuContent />
          </Grid>
        </Grid>
      </ModalWrapper>
    </>
  );
};
