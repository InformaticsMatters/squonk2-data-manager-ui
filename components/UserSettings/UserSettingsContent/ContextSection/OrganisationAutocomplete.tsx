import { useGetOrganisations } from '@squonk/account-server-client/organisation';

import { TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

import { useOrganisationUnit } from '../../../../context/organisationUnitContext';
import { getErrorMessage } from '../../../../utils/orvalError';

export const OrganisationAutocomplete = () => {
  const { data, isLoading, isError, error } = useGetOrganisations();
  const { organisationUnit, dispatchOrganisationUnit } = useOrganisationUnit();

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <Autocomplete
      fullWidth
      getOptionLabel={(option) => option.name}
      id="organisation-selection"
      loading={isLoading}
      options={data?.organisations ?? []}
      renderInput={(params) => <TextField {...params} label="Organisation" size="medium" />}
      value={organisationUnit.organisation ?? null}
      onChange={(_, organisation) => {
        dispatchOrganisationUnit({ type: 'setOrganisation', payload: organisation });
      }}
    />
  );
};
