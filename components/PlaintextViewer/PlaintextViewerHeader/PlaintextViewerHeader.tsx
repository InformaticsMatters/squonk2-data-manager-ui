import { css } from '@emotion/react';
import { Box, Divider, Typography, useTheme } from '@material-ui/core';
import fileSize from 'filesize';

import { DownloadButton } from '../../DownloadButton';
import { FileInfoChips } from './FileInfoChips';
import { useGetFileInfoChips } from './useGetFileInfoChips';

export interface PlaintextViewerHeaderProps {
  /**
   * Title for the viewer, displayed in bold.
   */
  title: string;
  /**
   * Number of lines of a displayed content.
   */
  numberOfLines: number;
  /**
   * Transferred size of the displayed content in bytes.
   */
  transferredSize: number;
  /**
   * Decompression method used to decompress the displayed content,
   */
  decompress?: string;
  /**
   * Maximum size in bytes of the displayed content.
   */
  fileSizeLimit?: number;
  /**
   * URL where to download the content's original file.
   */
  downloadUrl: string;
}

/**
 * Displays a header bar for `PlaintextViewer`.
 */
export const PlaintextViewerHeader = ({
  title,
  numberOfLines,
  transferredSize,
  decompress,
  fileSizeLimit,
  downloadUrl,
}: PlaintextViewerHeaderProps) => {
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
          component="h1"
          css={css`
            word-break: break-all;
          `}
        >
          <b>{title}</b>
        </Typography>
        <Divider flexItem orientation="vertical" />
        <Typography>
          {numberOfLines} lines ({fileSize(transferredSize)})
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
        <DownloadButton href={downloadUrl} tooltip="Download original file" />
      </Box>
    </Box>
  );
};
