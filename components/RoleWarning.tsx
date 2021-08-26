import React from 'react';

import { Box } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import { useIsAuthorized } from '../hooks/useIsAuthorized';
import { useKeycloakUser } from '../hooks/useKeycloakUser';

export const RoleWarning = () => {
  const isAuthorized = useIsAuthorized();
  const { user } = useKeycloakUser();

  if (user.username !== undefined && !isAuthorized) {
    return (
      <Box m={2}>
        <Alert severity="warning">
          You are missing the required role to access this service. Please contact an administrator.
        </Alert>
      </Box>
    );
  }

  return null;
};
