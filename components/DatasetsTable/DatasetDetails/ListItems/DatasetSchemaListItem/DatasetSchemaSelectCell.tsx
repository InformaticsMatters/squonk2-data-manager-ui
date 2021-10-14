import { useLayoutEffect, useState } from 'react';

import { css } from '@emotion/react';
import { Box, IconButton, MenuItem, Select } from '@material-ui/core';
import { Restore } from '@material-ui/icons';

export interface DatasetSchemaSelectCellProp<V extends readonly string[]> {
  field: string;
  fieldKey: string;
  value: V[number];
  updateField: (value: V[number]) => void;
  originalValue: V[number];
  options: V;
}

export const DatasetSchemaSelectCell = <V extends readonly string[]>({
  value,
  field,
  fieldKey,
  updateField,
  originalValue,
  options,
}: DatasetSchemaSelectCellProp<V>) => {
  const [displayValue, setDisplayValue] = useState(value);

  useLayoutEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const onRestore = () => {
    updateField(originalValue);
  };

  const hasChanged = displayValue !== originalValue;

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
        <Select
          disableUnderline
          fullWidth
          aria-label={`${field} ${fieldKey}`}
          css={css`
            padding: 0;
            align-self: stretch;
            & > div {
              background-color: unset !important;
            }
          `}
          value={displayValue}
          onBlur={() => updateField(displayValue)}
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
        <IconButton
          css={css`
            ${!hasChanged ? 'visibility: hidden' : undefined}
          `}
          size="small"
          onClick={onRestore}
        >
          <Restore fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
