import type { OrganisationDetail } from "@squonk/account-server-client";
import { useGetOrganisations } from "@squonk/account-server-client/organisation";

import type { AutocompleteProps } from "@mui/material";
import { Autocomplete, TextField, Typography } from "@mui/material";

import { useOrganisationUnit } from "../../context/organisationUnitContext";
import { useCurrentProjectId } from "../../hooks/projectHooks";
import { getErrorMessage } from "../../utils/orvalError";

type OrganisationAutocompleteProps = Omit<
  AutocompleteProps<OrganisationDetail, false, false, false>,
  "renderInput" | "options"
>;

/**
 * Autocomplete which lists organisations available to a user to select as context.
 */
export const OrganisationAutocomplete = (props: OrganisationAutocompleteProps) => {
  const { organisationUnit, dispatchOrganisationUnit } = useOrganisationUnit();
  const { setCurrentProjectId } = useCurrentProjectId();

  const { data, isLoading, isError, error } = useGetOrganisations();
  const organisations = data?.organisations ?? [];

  if (isError) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <Autocomplete
      {...props}
      fullWidth
      getOptionLabel={(option) => option.name}
      id="organisation-selection"
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={isLoading}
      options={organisations}
      renderInput={(params) => <TextField {...params} label="Organisation" />}
      value={organisationUnit.organisation ?? null}
      onChange={(_, organisation) => {
        // Not the best solution but I couldn't figure out anything better
        if (organisation?.id !== organisationUnit.organisation?.id) {
          setCurrentProjectId();
          dispatchOrganisationUnit({ type: "setUnit", payload: null });
        }

        dispatchOrganisationUnit({ type: "setOrganisation", payload: organisation });
      }}
    />
  );
};
