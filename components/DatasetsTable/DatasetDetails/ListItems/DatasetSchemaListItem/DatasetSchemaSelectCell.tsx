import { useLayoutEffect, useState } from 'react';

import { css } from '@emotion/react';
import { Box, IconButton, MenuItem, Select } from '@material-ui/core';
import { Restore } from '@material-ui/icons';

import { JSON_SCHEMA_TYPES } from './constants';
import type { Field, FieldKey } from './types';

export interface DatasetSchemaSelectCellProp {
  field: string;
  fieldKey: FieldKey;
  value: Field[FieldKey];
  updateField: (field: string, fieldKey: FieldKey, value: Field[FieldKey]) => void;
}

export const DatasetSchemaSelectCell = ({
  value,
  field,
  fieldKey,
  updateField,
}: DatasetSchemaSelectCellProp) => {
  const [displayValue, setDisplayValue] = useState(value);

  useLayoutEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const onRestore = () => {
    updateField(field, fieldKey, '');
  };

  const hasChanged = true;

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
          onBlur={() => updateField(field, fieldKey, displayValue)}
          onChange={(event) => setDisplayValue(event.target.value as Field[FieldKey])}
        >
          {JSON_SCHEMA_TYPES.map((type) => {
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
