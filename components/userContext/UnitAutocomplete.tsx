import { useQueryClient } from 'react-query';

import type { UnitDetail } from '@squonk/account-server-client';
import {
  getGetOrganisationUnitsQueryKey,
  useDeleteDefaultUnit,
  useGetOrganisationUnits,
} from '@squonk/account-server-client/unit';

import { IconButton, InputAdornment, TextField, Typography } from '@material-ui/core';
import { DeleteForever } from '@material-ui/icons';
import type { AutocompleteProps } from '@material-ui/lab';
import { Autocomplete } from '@material-ui/lab';

import { useOrganisationUnit } from '../../context/organisationUnitContext';
import { useCurrentProjectId } from '../../hooks/projectHooks';
import { useKeycloakUser } from '../../hooks/useKeycloakUser';
import { getErrorMessage } from '../../utils/orvalError';
import { WarningDeleteButton } from '../WarningDeleteButton';

type UnitAutocompleteProps = Omit<
  AutocompleteProps<UnitDetail, false, false, false>,
  'renderInput' | 'options'
>;

/**
 * Autocomplete which lists context's organisation's units available to a user to select as context.
 */
export const UnitAutocomplete = (props: UnitAutocompleteProps) => {
  const { organisationUnit, dispatchOrganisationUnit } = useOrganisationUnit();
  const { organisation, unit } = organisationUnit;

  const { setCurrentProjectId } = useCurrentProjectId();

  const organisationId = organisation?.id ?? '';
  const { data, isLoading, isError, error } = useGetOrganisationUnits(organisationId, {
    query: { enabled: !!organisationId },
  });

  const queryClient = useQueryClient();
  const { mutateAsync: deleteUnit } = useDeleteDefaultUnit();

  const { user } = useKeycloakUser();
  const isOwner = user.username === unit?.owner_id;

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <Autocomplete
      {...props}
      fullWidth
      getOptionLabel={(option) => option.name}
      getOptionSelected={(option, value) => option.id === value.id}
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
                  onDelete={async () => {
                    dispatchOrganisationUnit({ type: 'setUnit', payload: null });
                    await deleteUnit();
                    queryClient.invalidateQueries(getGetOrganisationUnitsQueryKey(organisationId));
                  }}
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
