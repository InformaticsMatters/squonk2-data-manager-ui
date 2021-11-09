import { css } from '@emotion/react';
import { Box, Chip, Divider, IconButton, Tooltip, Typography, useTheme } from '@material-ui/core';
import { GetApp } from '@material-ui/icons';
import fileSize from 'filesize';

export interface ViewerHeaderProps {
  lines: string[];
  transferredSize: number;
  decompress?: string | string[];
  fileSizeLimit?: string | string[];
}

export const ViewerHeader = ({
  lines,
  transferredSize,
  decompress,
  fileSizeLimit,
}: ViewerHeaderProps) => {
  const theme = useTheme();

  return (
    <Box
      css={css`
        background: ${theme.palette.type === 'light'
          ? theme.palette.grey[200]
          : theme.palette.grey[900]};
        box-shadow: ${theme.shadows[0]};
        border-radius: ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0;
      `}
      display="flex"
      paddingX={2}
      paddingY={1}
    >
      <Box
        alignItems="center"
        css={css`
          gap: ${theme.spacing()}px;
        `}
        display="flex"
        flex="1 1 auto"
      >
        <Typography>
          {lines.length} lines ({fileSize(transferredSize)})
        </Typography>
        {(decompress || fileSizeLimit) && <Divider flexItem orientation="vertical" />}
        <Box
          css={css`
            gap: ${theme.spacing()}px;
          `}
          display="flex"
        >
          {decompress && <Chip label="Decompressed" size="small" variant="outlined" />}
          {fileSizeLimit && <Chip label="Limited view" size="small" variant="outlined" />}
        </Box>
      </Box>
      <Box flex="0 0 auto">
        <Tooltip title="Download original">
          <IconButton size="small">
            <GetApp />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
