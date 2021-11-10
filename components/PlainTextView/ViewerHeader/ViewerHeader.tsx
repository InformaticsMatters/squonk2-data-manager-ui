import { css } from '@emotion/react';
import { Box, Divider, IconButton, Tooltip, Typography, useTheme } from '@material-ui/core';
import { GetApp } from '@material-ui/icons';
import fileSize from 'filesize';

import { FileInfoChips } from './FileInfoChips';
import { useGetFileInfoChips } from './useGetFileInfoChips';

export interface ViewerHeaderProps {
  title: string;
  lines: string[];
  transferredSize: number;
  decompress?: string;
  fileSizeLimit?: number;
  downloadUrl: string;
}

export const ViewerHeader = ({
  title,
  lines,
  transferredSize,
  decompress,
  fileSizeLimit,
  downloadUrl,
}: ViewerHeaderProps) => {
  const theme = useTheme();

  const chips = useGetFileInfoChips(transferredSize, fileSizeLimit, decompress);

  return (
    <Box
      alignItems="center"
      css={css`
        background: ${theme.palette.type === 'light'
          ? theme.palette.grey[200]
          : theme.palette.grey[900]};
        box-shadow: ${theme.shadows[0]};
        border-radius: ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0;
        gap: ${theme.spacing(2)}px;
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
        <Typography
          css={css`
            word-break: break-all;
          `}
        >
          {title}
        </Typography>
        <Divider flexItem orientation="vertical" />
        <Typography>
          {lines.length} lines ({fileSize(transferredSize)})
        </Typography>
        {/** If there are any chips to be displayed, display a separator in front of them */}
        {Boolean(chips.length) && (
          <>
            <Divider flexItem orientation="vertical" />
            <FileInfoChips chips={chips} />
          </>
        )}
      </Box>
      <Box flex="0 0 auto">
        <Tooltip title="Download original file">
          <IconButton download href={downloadUrl} size="small">
            <GetApp />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
