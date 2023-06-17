import type { OrganisationDetail } from "@squonk/account-server-client";
import { useGetOrganisations } from "@squonk/account-server-client/organisation";

import type { AutocompleteProps } from "@mui/material";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

import { projectPayload, useCurrentProjectId } from "../../hooks/projectHooks";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { PROJECT_LOCAL_STORAGE_KEY, writeToLocalStorage } from "../../utils/next/localStorage";
import { getErrorMessage } from "../../utils/next/orvalError";
import { ItemIcons } from "./ItemIcons";

export interface SelectOrganisationProps
  extends Omit<
    AutocompleteProps<OrganisationDetail, false, false, false>,
    "renderInput" | "options"
  > {
  userFilter?: string;
}

/**
 * Autocomplete which lists organisations available to a user to select as context.
 */
export const SelectOrganisation = ({
  userFilter,
  ...autoCompleteProps
}: SelectOrganisationProps) => {
  const [, setUnit] = useSelectedUnit();
  const [organisation, setOrganisation] = useSelectedOrganisation();
  const { setCurrentProjectId } = useCurrentProjectId();

  const { data, isLoading, isError, error } = useGetOrganisations();
  const organisations =
    data?.organisations.filter(
      (organisation) =>
        !userFilter || organisation.owner_id === userFilter || organisation.name === "Default",
    ) ?? [];

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <>
      <Autocomplete
        {...autoCompleteProps}
        fullWidth
        getOptionLabel={(option) => option.name}
        id="organisation-selection"
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={isLoading}
        options={organisations}
        renderInput={(params) => (
          <TextField
            {...params}
            InputProps={{
              ...params.InputProps,
              startAdornment: <ItemIcons item={organisation} />,
            }}
            label="Organisation"
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
        value={organisation ?? null}
        onChange={(_, newOrganisation) => {
          // Not the best solution but I couldn't figure out anything better
          if (newOrganisation?.id !== organisation?.id) {
            setCurrentProjectId();
            setUnit(undefined);
            writeToLocalStorage(PROJECT_LOCAL_STORAGE_KEY, projectPayload(undefined));
          }

          setOrganisation(newOrganisation ?? undefined);
        }}
      />
      {
        // N.B. This isn't helperText as MUI doesn't make that selectable
        <Typography color="text.secondary" variant="body2">
          {organisation?.id}
        </Typography>
      }
    </>
  );
};
