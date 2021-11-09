import { css } from '@emotion/react';
import { Box, Chip, Tooltip, useTheme } from '@material-ui/core';

import type { FileInfoChip } from './types';

export interface FileInfoChipsProps {
  chips: FileInfoChip[];
}

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
