import { type UnitGetResponse } from "@/api/account-server";

import { DataUsage as DataUsageIcon, Receipt as ReceiptIcon } from "@mui/icons-material";
import { Autocomplete, type AutocompleteProps, Box, TextField, Typography } from "@mui/material";

import { administrationLinks } from "../../administration/routes";
import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useGetVisibleUnits } from "../../hooks/useGetVisibleUnits";
import { isUnitId } from "../../routing/identifiers";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { getErrorMessage } from "../../utils/next/orvalError";
import { Adornment } from "./Adornment";
import { type PermissionLevelFilter } from "./filter";
import { ItemIcons } from "./ItemIcons";

export interface SelectUnitProps extends Omit<
  AutocompleteProps<UnitGetResponse, false, false, false>,
  "options" | "renderInput"
> {
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
              ...params.slotProps,

              input: {
                ...params.slotProps.input,
                startAdornment: (
                  <>
                    <ItemIcons item={unit} />
                    {!!unit && !!(unit.caller_is_member || organisation?.caller_is_member) && (
                      <>
                        <Adornment
                          href={
                            isUnitId(unit.id)
                              ? administrationLinks.chargeResource("units", unit.id)
                              : administrationLinks.charges()
                          }
                          title="Charges"
                        >
                          <ReceiptIcon />
                        </Adornment>
                        <Adornment
                          href={
                            isUnitId(unit.id)
                              ? administrationLinks.usageInventoryResource("units", unit.id)
                              : administrationLinks.usageInventory()
                          }
                          title="Usage & inventory"
                        >
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
        renderOption={({ key, ...props }, option) => (
          <Box component="li" key={key} {...props}>
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
