import { useGetOrganisations } from '@squonk/account-server-client/organisation';

import { TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

import { useOrganisationUnit } from '../../../../context/organisationUnitContext';
import { useCurrentProjectId } from '../../../../hooks/projectHooks';
import { getErrorMessage } from '../../../../utils/orvalError';

export const OrganisationAutocomplete = () => {
  const { data, isLoading, isError, error } = useGetOrganisations();
  const { organisationUnit, dispatchOrganisationUnit } = useOrganisationUnit();
  const { setCurrentProjectId } = useCurrentProjectId();

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <Autocomplete
      fullWidth
      getOptionLabel={(option) => option.name}
      //getOptionSelected={(option, value) => option.id === value.id}
      id="organisation-selection"
      loading={isLoading}
      options={data?.organisations ?? []}
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
