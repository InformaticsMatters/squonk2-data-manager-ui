import React from 'react';

import { Link, Typography } from '@material-ui/core';
import NextLink from 'next/link';

import { useKeycloakUser } from '../../hooks/useKeycloakUser';
import { CenterLoader } from '../CenterLoader';
import { UserSettings } from '../UserSettings';

/**
 * Content of the user menu
 */
export const UserMenuContent = () => {
  const { user, isLoading } = useKeycloakUser();
  return (
    <>
      <Typography gutterBottom component="h3" variant="h3">
        Account
      </Typography>
      {isLoading ? (
        <CenterLoader />
      ) : user.username ? (
        <>
          <Typography>
            {user.username} /{' '}
            <NextLink passHref href="/api/auth/logout">
              <Link>Logout</Link>
            </NextLink>
          </Typography>
          <UserSettings />
        </>
      ) : (
        <Typography>
          <NextLink passHref href="/api/auth/login">
            <Link>Login</Link>
          </NextLink>
        </Typography>
      )}
    </>
  );
};
