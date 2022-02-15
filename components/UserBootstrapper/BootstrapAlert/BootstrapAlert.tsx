import { useQuery } from 'react-query';

import type { AsError, OrganisationDetail, UnitDetail } from '@squonk/account-server-client';

import { css } from '@emotion/react';
import { Box } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import axios from 'axios';

import { AS_API_URL } from '../../../constants';
import { BootstrapForm } from './BootstrapForm';

// TODO remove these after AS client is updated
interface OrganisationUnitsGetResponse {
  organisation: OrganisationDetail;
  units: UnitDetail[];
}

interface UnitsGetResponse {
  units: OrganisationUnitsGetResponse[];
}

/**
 * Boostraps a user which doesn't have any units with a default unit and a project
 */
export const BootstrapAlert = () => {
  const { data: unitsData, isLoading: isLoadingUnits } = useQuery<UnitsGetResponse, AsError>(
    `${AS_API_URL}/unit`, // TODO change this once AS client is updated
    async () => {
      const response = await axios.get<UnitsGetResponse>(`${AS_API_URL}/unit`); // TODO change this once AS client is updated
      return response.data;
    },
  );

  const hasUnits = unitsData?.units.some((u) => u.units.length);

  if (isLoadingUnits) {
    return null;
  }

  if (!hasUnits) {
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
