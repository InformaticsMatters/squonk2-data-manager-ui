import { useQueryClient } from "react-query";

import type { UnitGetResponse } from "@squonk/account-server-client";
import {
  getGetOrganisationUnitsQueryKey,
  getGetUnitsQueryKey,
  useDeleteDefaultUnit,
  useGetOrganisationUnits,
} from "@squonk/account-server-client/unit";

import { DeleteForever } from "@mui/icons-material";
import type { AutocompleteProps } from "@mui/material";
import { Autocomplete, IconButton, InputAdornment, TextField, Typography } from "@mui/material";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { getErrorMessage } from "../../utils/orvalError";
import { WarningDeleteButton } from "../WarningDeleteButton";

type UnitAutocompleteProps = Omit<
  AutocompleteProps<UnitGetResponse, false, false, false>,
  "renderInput" | "options"
>;

/**
 * Autocomplete which lists context's organisation's units available to a user to select as context.
 */
export const UnitAutocomplete = (props: UnitAutocompleteProps) => {
  const [unit, setUnit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  const { setCurrentProjectId } = useCurrentProjectId();

  const organisationId = organisation?.id ?? "";
  const { data, isLoading, isError, error } = useGetOrganisationUnits(organisationId, {
    query: { enabled: !!organisationId },
  });
  const units = data?.units;

  const queryClient = useQueryClient();
  const { mutateAsync: deleteUnit, isLoading: isDeleting } = useDeleteDefaultUnit();

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
      id="unit-selection"
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={isLoading}
      options={units ?? []}
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
                    await deleteUnit();
                    setUnit();
                    queryClient.invalidateQueries(getGetOrganisationUnitsQueryKey(organisationId));
                    queryClient.invalidateQueries(getGetUnitsQueryKey());
                  }}
                >
                  {({ openModal }) => (
                    <IconButton
                      aria-label="Delete selected unit"
                      disabled={isDeleting}
                      size="large"
                      onClick={openModal}
                    >
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
      onChange={(_, newUnit) => {
        // Not the best solution but I couldn't figure out anything better
        if (newUnit?.id !== unit?.id) {
          setCurrentProjectId();
        }
        setUnit(newUnit ?? undefined);
      }}
    />
  );
};
