import { useGetOrganisationUnits } from '@squonk/account-server-client/unit';

import { IconButton, InputAdornment, TextField, Typography } from '@material-ui/core';
import { DeleteForever } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';

import { useOrganisationUnit } from '../../../../context/organisationUnitContext';
import { useCurrentProjectId } from '../../../../hooks/projectHooks';
import { useKeycloakUser } from '../../../../hooks/useKeycloakUser';
import { getErrorMessage } from '../../../../utils/orvalError';
import { WarningDeleteButton } from '../../../WarningDeleteButton';

export const UnitAutocomplete = () => {
  const { organisationUnit, dispatchOrganisationUnit } = useOrganisationUnit();
  const { organisation, unit } = organisationUnit;
  const { setCurrentProjectId } = useCurrentProjectId();

  const organisationId = organisation?.id ?? '';
  const { data, isLoading, isError, error } = useGetOrganisationUnits(organisationId, {
    query: { enabled: !!organisationId },
  });

  const { user } = useKeycloakUser();
  const isOwner = user.username === unit?.owner_id;

  const handleDelete = async () => {
    // TODO
  };

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <Autocomplete
      fullWidth
      getOptionLabel={(option) => option.name}
      //getOptionSelected={(option, value) => option.id === value.id}
      id="unit-selection"
      loading={isLoading}
      options={data?.units ?? []}
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{
            ...params.InputProps,
            startAdornment: isOwner && (
              <InputAdornment position="start">
                <WarningDeleteButton
                  modalId={`delete-${unit?.id}`}
                  title="Delete Unit"
                  tooltipText="Delete selected unit"
                  onDelete={handleDelete}
                >
                  {({ openModal }) => (
                    <IconButton aria-label="Delete selected unit" onClick={openModal}>
                      <DeleteForever />
                    </IconButton>
                  )}
                </WarningDeleteButton>
              </InputAdornment>
            ),
          }}
          label="Unit"
          size="medium"
        />
      )}
      value={unit ?? null}
      onChange={(_, unit) => {
        // Not the best solution but I couldnt figure out anything better
        if (unit?.id !== organisationUnit.unit?.id) {
          setCurrentProjectId();
        }

        dispatchOrganisationUnit({ type: 'setUnit', payload: unit });
      }}
    />
  );
};
