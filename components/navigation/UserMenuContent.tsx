import React from 'react';

import { FormControlLabel, Link, Switch, Typography } from '@material-ui/core';
import NextLink from 'next/link';

import { useColorScheme } from '../../context/colorSchemeContext';
import { useKeycloakUser } from '../../hooks/useKeycloakUser';
import { CenterLoader } from '../CenterLoader';

/**
 * Content of the user menu
 */
export const UserMenuContent = () => {
  const { user, isLoading } = useKeycloakUser();
  const [scheme, setScheme] = useColorScheme();
  return (
    <>
      <Typography gutterBottom component="h3" variant="h3">
        Account
      </Typography>
      {isLoading ? (
        <CenterLoader />
      ) : user.username ? (
        <Typography>
          {user.username} /{' '}
          <NextLink passHref href="/api/auth/logout">
            <Link>Logout</Link>
          </NextLink>
        </Typography>
      ) : (
        <Typography>
          <NextLink passHref href="/api/auth/login">
            <Link>Login</Link>
          </NextLink>
        </Typography>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={scheme === 'dark'}
            inputProps={{ 'aria-label': 'color-scheme-toggle' }}
            onChange={(event) => setScheme(event.target.checked ? 'dark' : 'light')}
          />
        }
        label="Dark Mode"
      />
    </>
  );
};
