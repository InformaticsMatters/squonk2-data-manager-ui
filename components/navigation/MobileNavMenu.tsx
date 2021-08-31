import React, { useState } from 'react';

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
import { useRouter } from 'next/router';

import { useIsAuthorized } from '../../hooks/useIsAuthorized';
import { ModalWrapper } from '../Modals/ModalWrapper';
import { ProjectManager } from '../ProjectManager/ProjectManager';
import { NavLink } from './NavLink';
import { UserMenuContent } from './UserMenuContent';

export const MobileNavMenu = () => {
  const router = useRouter();
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
              <NavLink
                stripQueryParameters={
                  router.pathname === '/data' ? ['pid', 'project', 'path'] : ['pid', 'path']
                }
                title="Data"
              >
                {({ active }) => (
                  <ListItem button component="a" selected={active}>
                    <ListItemText primary="Data" />
                  </ListItem>
                )}
              </NavLink>
              <NavLink stripQueryParameters={['pid', 'path']} title="Executions">
                {({ active }) => (
                  <ListItem button component="a" selected={active}>
                    <ListItemText primary="Executions" />
                  </ListItem>
                )}
              </NavLink>
              <NavLink stripQueryParameters={['pid', 'path']} title="Tasks">
                {({ active }) => (
                  <ListItem button component="a" selected={active}>
                    <ListItemText primary="Tasks" />
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
                <Typography gutterBottom component="h3" variant="h6">
                  Project
                </Typography>
                <ProjectManager wrap />
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
