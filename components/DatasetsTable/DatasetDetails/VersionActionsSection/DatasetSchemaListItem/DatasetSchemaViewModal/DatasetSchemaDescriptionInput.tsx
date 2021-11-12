import { useLayoutEffect, useState } from 'react';

import { css } from '@emotion/react';
import { Box, IconButton, TextField, Tooltip, useTheme } from '@material-ui/core';
import { Restore } from '@material-ui/icons';

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
  const theme = useTheme();

  const [displayValue, setDisplayValue] = useState(value || '');

  useLayoutEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const hasChanged = displayValue !== originalValue;

  return (
    <TextField
      fullWidth
      css={css`
        ${hasChanged ? `background: ${theme.palette.action.hover};` : undefined}
        margin-right: ${theme.spacing(2)}px;
      `}
      InputProps={{
        endAdornment: (
          <Box
            css={css`
              ${!hasChanged ? 'visibility: hidden' : undefined}
            `}
            marginLeft={1}
          >
            <Tooltip title="Revert changes">
              <IconButton size="small" onClick={() => setDescription(originalValue || '')}>
                <Restore />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      }}
      label="Schema description"
      value={displayValue || ''}
      onBlur={() => setDescription(displayValue)}
      onChange={(event) => setDisplayValue(event.target.value)}
    />
  );
};
