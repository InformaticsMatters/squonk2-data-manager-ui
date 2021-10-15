import { useLayoutEffect, useState } from 'react';

import { css } from '@emotion/react';
import { Box, IconButton, MenuItem, Select, Tooltip } from '@material-ui/core';
import { Restore } from '@material-ui/icons';

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
        <Tooltip title="Revert changes">
          <IconButton
            css={css`
              ${!hasChanged ? 'visibility: hidden' : undefined}
            `}
            size="small"
            onClick={() => setValue(originalValue)}
          >
            <Restore fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
