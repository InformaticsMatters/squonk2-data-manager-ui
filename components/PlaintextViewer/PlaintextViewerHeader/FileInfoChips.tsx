import { css } from '@emotion/react';
import { Box, Chip, Tooltip, useTheme } from '@material-ui/core';

import type { FileInfoChip } from './types';

export interface FileInfoChipsProps {
  /**
   * Chip data to be displayed.
   */
  chips: FileInfoChip[];
}

/**
 * A container which renders information about a displayed content in the form of Chips.
 */
export const FileInfoChips = ({ chips }: FileInfoChipsProps) => {
  const theme = useTheme();

  return (
    <Box
      css={css`
        gap: ${theme.spacing()}px;
      `}
      display="flex"
      flexWrap="wrap"
    >
      {chips.map((chip) => (
        <Tooltip key={chip.label} title={chip.description}>
          <Chip label={chip.label} size="small" variant="outlined" />
        </Tooltip>
      ))}
    </Box>
  );
};
