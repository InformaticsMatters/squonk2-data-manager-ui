import { useLayoutEffect, useState } from "react";

import { Restore } from "@mui/icons-material";
import { FormControl, IconButton, MenuItem, Select, Tooltip } from "@mui/material";

export interface DatasetSchemaSelectCellProps<V extends readonly string[]> {
  /**
   * Name of a schema field.
   */
  fieldName: string;
  /**
   * Key/attribute name of the schema field.
   */
  fieldKey: string;
  /**
   * Current value for the key/attribute of the schema field. Must be one from `options`.
   */
  fieldValue: V[number];
  /**
   * Callback to set value for the key of the schema field.
   */
  setFieldValue: (value: V[number]) => void;
  /**
   * Original value for the key/attribute of the schema field. Must be one from `options`.
   */
  originalFieldValue: V[number];
  /**
   * Possible options for the field value.
   */
  options: V;
}

/**
 * Editable cell for schema field values which are picked from a given string set.
 * The implementation makes a copy of provided value to avoid expensive updates to table data.
 */
export const DatasetSchemaSelectCell = <V extends readonly string[]>({
  fieldValue: value,
  fieldName: field,
  fieldKey,
  setFieldValue: setValue,
  originalFieldValue: originalValue,
  options,
}: DatasetSchemaSelectCellProps<V>) => {
  const [displayValue, setDisplayValue] = useState(value);

  useLayoutEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const hasChanged = displayValue !== originalValue;

  return (
    <FormControl fullWidth variant="outlined">
      <Select
        fullWidth
        aria-label={`${field} ${fieldKey}`}
        endAdornment={
          <Tooltip title="Revert changes">
            <IconButton
              size="small"
              sx={{
                visibility: hasChanged ? undefined : "hidden",
                position: "absolute",
                right: "26px",
              }}
              onClick={() => setValue(originalValue)}
            >
              <Restore fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        sx={{
          background: hasChanged ? "action.hover" : undefined,
          pr: 0,
          "& > div": {
            bgcolor: "unset !important",
            pt: "6px",
            pb: "7px",
            pr: "56px !important",
          },
        }}
        value={displayValue}
        onBlur={() => setValue(displayValue)}
        onChange={(event) => setDisplayValue(event.target.value as V[number])}
      >
        {options.map((type) => {
          return (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
