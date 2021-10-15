import { useLayoutEffect, useState } from 'react';

import { css } from '@emotion/react';
import { Box, IconButton, InputBase, Tooltip } from '@material-ui/core';
import { Restore } from '@material-ui/icons';

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

  const onRestore = () => {
    setFieldValue(originalFieldValue);
  };

  const hasChanged = displayValue !== originalFieldValue;

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
              <Tooltip title="Revert changes">
                <IconButton size="small" onClick={onRestore}>
                  <Restore fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
          inputProps={{ 'aria-label': `${fieldName} ${fieldKey}` }}
          value={displayValue}
          onBlur={() => setFieldValue(displayValue)}
          onChange={(event) => setDisplayValue(event.target.value)}
        />
      </Box>
    </Box>
  );
};
