import { type OrganisationDetail } from "@/api/account-server";
import { useGetOrganisations } from "@/api/account-server/organisation";

import { DataUsage as DataUsageIcon } from "@mui/icons-material";
import { Autocomplete, type AutocompleteProps, Box, TextField, Typography } from "@mui/material";

import { administrationLinks } from "../../administration/routes";
import { useCurrentProjectId } from "../../hooks/projectHooks";
import { isOrganisationId } from "../../routing/identifiers";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { getErrorMessage } from "../../utils/next/orvalError";
import { Adornment } from "./Adornment";
import { ItemIcons } from "./ItemIcons";

export interface SelectOrganisationProps extends Omit<
  AutocompleteProps<OrganisationDetail, false, false, false>,
  "options" | "renderInput"
> {
  userFilter?: string;
}

/**
 * Autocomplete which lists organisations available to a user to select as context.
 */
export const SelectOrganisation = (autoCompleteProps: SelectOrganisationProps) => {
  const [, setUnit] = useSelectedUnit();
  const [organisation, setOrganisation] = useSelectedOrganisation();
  const { setCurrentProjectId } = useCurrentProjectId();

  const { data, isLoading, isError, error } = useGetOrganisations(undefined, {
    query: { select: (data) => data.organisations },
  });
  const organisations = data ?? [];

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
            label="Organisation"
            slotProps={{
              ...params.slotProps,

              input: {
                ...params.slotProps.input,
                startAdornment: (
                  <>
                    <ItemIcons item={organisation} />
                    {!!organisation && !!organisation.caller_is_member && (
                      <Adornment
                        href={
                          isOrganisationId(organisation.id)
                            ? administrationLinks.usageInventoryResource(
                                "organisations",
                                organisation.id,
                              )
                            : administrationLinks.usageInventory()
                        }
                        title="Usage & inventory"
                      >
                        <DataUsageIcon />
                      </Adornment>
                    )}
                  </>
                ),
              },
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box component="span" sx={{ display: "inline-block", pr: 1 }}>
              <ItemIcons item={option} />
            </Box>
            {option.name} {!!option.owner_id && <>({option.owner_id})</>}
          </Box>
        )}
        value={organisation ?? null}
        onChange={(_, newOrganisation) => {
          // Not the best solution but I couldn't figure out anything better
          if (newOrganisation?.id !== organisation?.id) {
            setCurrentProjectId();
            setUnit(undefined);
          }

          setOrganisation(newOrganisation ?? undefined);
        }}
      />
      {
        // N.B. This isn't helperText as MUI doesn't make that selectable
        <Typography sx={{ color: "text.secondary" }} variant="body2">
          {organisation?.id}
        </Typography>
      }
    </>
  );
};
