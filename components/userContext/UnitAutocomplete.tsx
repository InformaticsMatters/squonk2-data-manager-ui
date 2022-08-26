import type { UnitGetResponse } from "@squonk/account-server-client";
import { useGetOrganisationUnits } from "@squonk/account-server-client/unit";

import type { AutocompleteProps } from "@mui/material";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { getErrorMessage } from "../../utils/next/orvalError";
import { ItemIcons } from "./ItemIcons";

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

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <>
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
              startAdornment: <ItemIcons item={unit} />,
            }}
            label="Unit"
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box component="span" display="inline-block" pr={1}>
              <ItemIcons item={option} />
            </Box>
            {option.name} {option.owner_id && <>({option.owner_id})</>}
          </Box>
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
      {
        // N.B. This isn't helperText as MUI doesn't make that selectable
        <Typography color="text.secondary" variant="body2">
          {unit?.id}
        </Typography>
      }
    </>
  );
};
