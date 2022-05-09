import { useLayoutEffect, useState } from 'react';

import { Restore } from '@mui/icons-material';
import { Box, IconButton, TextField, Tooltip } from '@mui/material';

export interface DatasetSchemaInputCellProps {
  /**
   * Name of a schema field.
   */
  fieldName: string;
  /**
   * Key/attribute name of the schema field.
   */
  fieldKey: string;
  /**
   * Current value for the key/attribute of the schema field.
   */
  fieldValue: string;
  /**
   * Callback to set value for the key of the schema field.
   */
  setFieldValue: (value: string) => void;
  /**
   * Original value for the key/attribute of the schema field.
   */
  originalFieldValue: string;
}

/**
 * Editable cell for schema field values which are string based.
 * The implementation makes a copy of provided value to avoid expensive updates to table data.
 */
export const DatasetSchemaInputCell = ({
  fieldValue,
  fieldName,
  fieldKey,
  setFieldValue,
  originalFieldValue,
}: DatasetSchemaInputCellProps) => {
  const [displayValue, setDisplayValue] = useState(fieldValue);

  useLayoutEffect(() => {
    setDisplayValue(fieldValue);
  }, [fieldValue]);

  const hasChanged = displayValue !== originalFieldValue;

  return (
    <TextField
      fullWidth
      inputProps={{
        'aria-label': `${fieldName} ${fieldKey}`,
        style: {
          paddingTop: 6,
          paddingBottom: 7,
        },
      }}
      InputProps={{
        endAdornment: (
          <Box ml={1} mr={1} visibility={!hasChanged ? 'hidden' : undefined}>
            <Tooltip title="Revert changes">
              <IconButton size="small" onClick={() => setFieldValue(originalFieldValue)}>
                <Restore fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      }}
      sx={{ background: hasChanged ? 'action.hover' : undefined }}
      value={displayValue}
      onBlur={() => setFieldValue(displayValue)}
      onChange={(event) => setDisplayValue(event.target.value)}
    />
  );
};
