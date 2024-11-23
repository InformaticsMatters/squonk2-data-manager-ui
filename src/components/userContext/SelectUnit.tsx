import { type UnitGetResponse } from "@squonk/account-server-client";

import { DataUsage as DataUsageIcon, Receipt as ReceiptIcon } from "@mui/icons-material";
import { Autocomplete, type AutocompleteProps, Box, TextField, Typography } from "@mui/material";

import { projectPayload, useCurrentProjectId } from "../../hooks/projectHooks";
import { useGetVisibleUnits } from "../../hooks/useGetVisibleUnits";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { PROJECT_LOCAL_STORAGE_KEY, writeToLocalStorage } from "../../utils/next/localStorage";
import { getErrorMessage } from "../../utils/next/orvalError";
import { Adornment } from "./Adornment";
import { type PermissionLevelFilter } from "./filter";
import { ItemIcons } from "./ItemIcons";

export interface SelectUnitProps
  extends Omit<AutocompleteProps<UnitGetResponse, false, false, false>, "options" | "renderInput"> {
  userFilter: PermissionLevelFilter;
}

/**
 * Autocomplete which lists context's organisation's units available to a user to select as context.
 */
export const SelectUnit = ({
  userFilter: [level, user],
  ...autocompleteProps
}: SelectUnitProps) => {
  const [unit, setUnit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  const { setCurrentProjectId } = useCurrentProjectId();

  const { data: units, isLoading: isUnitsLoading, error } = useGetVisibleUnits(level, user);

  if (error) {
    return <Typography color="error">{getErrorMessage(error)}</Typography>;
  }

  return (
    <>
      <Autocomplete
        {...autocompleteProps}
        fullWidth
        getOptionLabel={(option) => option.name}
        id="unit-selection"
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={isUnitsLoading ? !!organisation?.id : undefined}
        options={units ?? []}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Unit"
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <>
                    <ItemIcons item={unit} />
                    {!!unit && !!(unit.caller_is_member || organisation?.caller_is_member) && (
                      <>
                        <Adornment href={`/unit/${unit.id}/charges`} title="Charges">
                          <ReceiptIcon />
                        </Adornment>
                        <Adornment href={`/unit/${unit.id}/inventory`} title="User Usage">
                          <DataUsageIcon />
                        </Adornment>
                      </>
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
            {option.name} {option.owner_id ? <>({option.owner_id})</> : null}
          </Box>
        )}
        value={unit ?? null}
        onChange={(_, newUnit) => {
          // Not the best solution but I couldn't figure out anything better
          if (newUnit?.id !== unit?.id) {
            setCurrentProjectId();
            writeToLocalStorage(PROJECT_LOCAL_STORAGE_KEY, projectPayload(undefined));
          }
          setUnit(newUnit ?? undefined);
        }}
      />
      {/* N.B. This isn't helperText as MUI doesn't make that selectable */}
      <Typography sx={{ color: "text.secondary" }} variant="body2">
        {unit?.id}
      </Typography>
    </>
  );
};
