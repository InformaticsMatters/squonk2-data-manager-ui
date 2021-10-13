import { useLayoutEffect, useState } from 'react';

import { css } from '@emotion/react';
import { Box, IconButton, InputBase, useTheme } from '@material-ui/core';
import { Clear } from '@material-ui/icons';

import type { Field, FieldKey } from './types';

export interface DatasetSchemaEditableCellProp {
  field: string;
  fieldKey: FieldKey;
  value: Field[FieldKey];
  updateField: (field: string, fieldKey: FieldKey, value: Field[FieldKey]) => void;
}

export const DatasetSchemaEditableCell = ({
  value,
  field,
  fieldKey,
  updateField,
}: DatasetSchemaEditableCellProp) => {
  const theme = useTheme();
  const [displayValue, setDisplayValue] = useState(value);

  useLayoutEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const onClear = () => {
    updateField(field, fieldKey, '');
  };

  const hasChanged = value !== displayValue;

  return (
    <Box display="flex" height={theme.spacing(5)} paddingLeft={2} paddingRight={1}>
      <InputBase
        fullWidth
        css={css`
          ${hasChanged ? 'background: rgba(0, 0, 0, 0.05);' : undefined}
          padding: ${theme.spacing()}px;
        `}
        endAdornment={
          <Box
            css={css`
              ${!hasChanged ? 'visibility: hidden' : undefined}
            `}
            marginLeft={1}
          >
            <IconButton size="small" onClick={onClear}>
              <Clear />
            </IconButton>
          </Box>
        }
        inputProps={{ 'aria-label': fieldKey }}
        value={displayValue}
        onBlur={() => updateField(field, fieldKey, displayValue)}
        onChange={(event) => setDisplayValue(event.target.value)}
      />
    </Box>
  );
};
