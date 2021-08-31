import React from 'react';

import { useUser } from '@auth0/nextjs-auth0';
import { Typography } from '@material-ui/core';
import Link from 'next/link';

export const UserMenuContent = () => {
  const { user, isLoading } = useUser();
  return (
    <>
      <Typography component="h3" variant="h6">
        Account
      </Typography>
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
    </>
  );
};
