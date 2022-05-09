import { useLayoutEffect, useState } from 'react';

import { Restore } from '@mui/icons-material';
import { Box, IconButton, TextField, Tooltip } from '@mui/material';

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
  const [displayValue, setDisplayValue] = useState(value || '');

  useLayoutEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const hasChanged = displayValue !== originalValue;

  return (
    <TextField
      fullWidth
      InputProps={{
        endAdornment: (
          <Box ml={1} visibility={!hasChanged ? 'hidden' : undefined}>
            <Tooltip title="Revert changes">
              <IconButton size="small" onClick={() => setDescription(originalValue || '')}>
                <Restore />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      }}
      label="Schema description"
      sx={{ mr: 2, background: hasChanged ? 'action.hover' : undefined }}
      value={displayValue || ''}
      onBlur={() => setDescription(displayValue)}
      onChange={(event) => setDisplayValue(event.target.value)}
    />
  );
};
