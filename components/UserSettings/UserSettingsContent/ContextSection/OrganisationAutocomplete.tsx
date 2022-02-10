import { useQuery } from 'react-query';

import type { AsError, OrganisationDetail, UnitDetail } from '@squonk/account-server-client';

import { TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import axios from 'axios';

import { AS_API_URL } from '../../../../constants';
import { useOrganisationUnit } from '../../../../context/organisationUnitContext';
import { useCurrentProjectId } from '../../../../hooks/projectHooks';
import { getErrorMessage } from '../../../../utils/orvalError';

interface OrganisationUnitsGetResponse {
  organisation: OrganisationDetail;
  /** A list of Units
   */
  units: UnitDetail[];
}

interface UnitsGetResponse {
  /** A list of Units
   */
  units: OrganisationUnitsGetResponse[];
}

export const OrganisationAutocomplete = () => {
  const { data, isLoading, isError, error } = useQuery<UnitsGetResponse, AsError>(
    `${AS_API_URL}/unit`,
    async () => {
      const response = await axios.get<UnitsGetResponse>(`${AS_API_URL}/unit`);
      return response.data;
    },
  );
  const { organisationUnit, dispatchOrganisationUnit } = useOrganisationUnit();
  const { setCurrentProjectId } = useCurrentProjectId();

  const organisations = data?.units.map(({ organisation }) => organisation) || [];

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <Autocomplete
      fullWidth
      getOptionLabel={(option) => option.name}
      getOptionSelected={(option, value) => option.id === value.id}
      id="organisation-selection"
      loading={isLoading}
      options={organisations}
      renderInput={(params) => <TextField {...params} label="Organisation" size="medium" />}
      value={organisationUnit.organisation ?? null}
      onChange={(_, organisation) => {
        // Not the best solution but I couldnt figure out anything better
        if (organisation?.id !== organisationUnit.organisation?.id) {
          setCurrentProjectId();
        }

        dispatchOrganisationUnit({ type: 'setOrganisation', payload: organisation });
      }}
    />
  );
};
