import React from 'react';

import { useUser } from '@auth0/nextjs-auth0';
import { FormControlLabel, Link, Switch, Typography } from '@material-ui/core';
import NextLink from 'next/link';

import { useColorScheme } from '../../context/colorSchemeContext';

export const UserMenuContent = () => {
  const { user, isLoading } = useUser();
  const [scheme, setScheme] = useColorScheme();
  return (
    <>
      <Typography gutterBottom component="h3" variant="h3">
        Account
      </Typography>
      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : user ? (
        <Typography>
          {user.preferred_username} /{' '}
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
            inputProps={{ 'aria-label': 'colour-scheme-toggle' }}
            onChange={(event) => setScheme(event.target.checked ? 'dark' : 'light')}
          />
        }
        label="Dark Mode"
      />
    </>
  );
};
