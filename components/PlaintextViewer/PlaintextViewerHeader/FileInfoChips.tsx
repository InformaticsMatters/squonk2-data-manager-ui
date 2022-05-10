import { Box, Chip, Tooltip, useTheme } from '@mui/material';

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
    <Box display="flex" flexWrap="wrap" gap={theme.spacing()}>
      {chips.map((chip) => (
        <Tooltip key={chip.label} title={chip.description}>
          <Chip label={chip.label} size="small" variant="outlined" />
        </Tooltip>
      ))}
    </Box>
  );
};
