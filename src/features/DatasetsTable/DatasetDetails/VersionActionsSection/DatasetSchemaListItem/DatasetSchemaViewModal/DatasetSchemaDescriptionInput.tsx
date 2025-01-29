import { useLayoutEffect, useState } from "react";

import { Restore } from "@mui/icons-material";
import { Box, IconButton, TextField, Tooltip } from "@mui/material";

export interface DatasetSchemaDescriptionInputProps {
  /**
   * Current description value.
   */
  value?: string;
  /**
   * Callback to update description once input loses focus.
   */
  setDescription: (value: string) => void;
  /**
   * Original description value, used to revert changes made to the input.
   */
  originalValue?: string;
}

/**
 * Input which is used for displaying and editing the description of Dataset schema.
 * The implementation makes a copy of provided value to avoid expensive updates to table data.
 */
export const DatasetSchemaDescriptionInput = ({
  value,
  setDescription,
  originalValue,
}: DatasetSchemaDescriptionInputProps) => {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const [displayValue, setDisplayValue] = useState(value || "");

  useLayoutEffect(() => {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    setDisplayValue(value || "");
  }, [value]);

  const hasChanged = displayValue !== originalValue;

  return (
    <TextField
      fullWidth
      label="Schema description"
      slotProps={{
        input: {
          endAdornment: (
            <Box sx={{ ml: 1, visibility: hasChanged ? undefined : "hidden" }}>
              <Tooltip title="Revert changes">
                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                <IconButton size="small" onClick={() => setDescription(originalValue || "")}>
                  <Restore />
                </IconButton>
              </Tooltip>
            </Box>
          ),
        },
      }}
      sx={{ mr: 2, background: hasChanged ? "action.hover" : undefined }}
      value={displayValue || ""}
      onBlur={() => setDescription(displayValue)}
      onChange={(event) => setDisplayValue(event.target.value)}
    />
  );
};
