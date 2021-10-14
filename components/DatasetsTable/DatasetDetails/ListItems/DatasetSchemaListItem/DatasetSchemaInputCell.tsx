import { useLayoutEffect, useState } from 'react';

import { css } from '@emotion/react';
import { Box, IconButton, InputBase } from '@material-ui/core';
import { Restore } from '@material-ui/icons';

import type { Field, FieldKey } from './types';

export interface DatasetSchemaInputCellProp {
  field: string;
  fieldKey: FieldKey;
  value: Field[FieldKey];
  updateField: (field: string, fieldKey: FieldKey, value: Field[FieldKey]) => void;
}

export const DatasetSchemaInputCell = ({
  value,
  field,
  fieldKey,
  updateField,
}: DatasetSchemaInputCellProp) => {
  const [displayValue, setDisplayValue] = useState(value);

  useLayoutEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const onRestore = () => {
    updateField(field, fieldKey, '');
  };

  const hasChanged = value !== displayValue;

  return (
    <Box alignItems="stretch" display="flex">
      <Box
        alignItems="center"
        bgcolor={hasChanged ? 'action.hover' : undefined}
        display="flex"
        paddingLeft={2}
        paddingRight={1}
        width={1}
      >
        <InputBase
          fullWidth
          endAdornment={
            <Box
              css={css`
                ${!hasChanged ? 'visibility: hidden' : undefined}
              `}
              marginLeft={1}
            >
              <IconButton size="small" onClick={onRestore}>
                <Restore fontSize="small" />
              </IconButton>
            </Box>
          }
          inputProps={{ 'aria-label': `${field} ${fieldKey}` }}
          value={displayValue}
          onBlur={() => updateField(field, fieldKey, displayValue)}
          onChange={(event) => setDisplayValue(event.target.value)}
        />
      </Box>
    </Box>
  );
};
