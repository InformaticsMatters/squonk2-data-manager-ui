import { useLayoutEffect, useState } from 'react';

import { css } from '@emotion/react';
import { Box, IconButton, InputBase } from '@material-ui/core';
import { Restore } from '@material-ui/icons';

export interface DatasetSchemaDescriptionInputProps {
  value?: string;
  updateDescription: (value: string) => void;
  originalValue?: string;
}

export const DatasetSchemaDescriptionInput = ({
  value,
  updateDescription,
  originalValue,
}: DatasetSchemaDescriptionInputProps) => {
  const [displayValue, setDisplayValue] = useState(value || '');

  useLayoutEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const onRestore = () => {
    updateDescription(originalValue || '');
  };

  const hasChanged = displayValue !== originalValue;

  return (
    <Box
      bgcolor={hasChanged ? 'action.hover' : undefined}
      paddingLeft={2}
      paddingRight={2}
      width={1}
    >
      <InputBase
        fullWidth
        multiline
        endAdornment={
          <Box
            alignSelf="flex-start"
            css={css`
              ${!hasChanged ? 'visibility: hidden' : undefined}
            `}
            marginLeft={1}
          >
            <IconButton size="small" onClick={onRestore}>
              <Restore />
            </IconButton>
          </Box>
        }
        inputProps={{ 'aria-label': 'dataset schema description' }}
        placeholder="Insert description here"
        value={displayValue || ''}
        onBlur={() => updateDescription(displayValue)}
        onChange={(event) => setDisplayValue(event.target.value)}
      />
    </Box>
  );
};
