import { useGetUnits } from '@squonk/account-server-client/unit';

import { css } from '@emotion/react';
import { Box } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import { useKeycloakUser } from '../../../hooks/useKeycloakUser';
import { BootstrapForm } from './BootstrapForm';
/**
 * Boostraps a user which doesn't have any units with a default unit and a project
 */
export const BootstrapAlert = () => {
  const { data: unitsData, isLoading: isLoadingUnits } = useGetUnits();
  const { user } = useKeycloakUser();

  const userDefaultUnit = unitsData?.units
    .find((orgUnit) => orgUnit.organisation.name === 'Default')
    ?.units.find((unit) => unit.owner_id === user.username);

  if (isLoadingUnits) {
    return null;
  }

  if (!userDefaultUnit) {
    return (
      <Box m={2}>
        <Alert
          css={css`
            .MuiAlert-message {
              width: 100%;
            }
          `}
          severity="info"
        >
          You are not part of any units. You may create a project under a new unit in the default
          organisation.
          <BootstrapForm />
        </Alert>
      </Box>
    );
  }

  return null;
};
