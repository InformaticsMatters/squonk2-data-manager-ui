import { css } from '@emotion/react';
import { Box, Paper } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import { CenterLoader } from '../CenterLoader';
import { ViewerContent } from './ViewerContent';
import { ViewerHeader } from './ViewerHeader';

export interface PlainTextViewerProps {
  content?: string;
  /**
   * If true, displays the loading icon.
   */
  isLoading?: boolean;
  /**
   * If true, displays the provided `error`.
   */
  isError?: boolean;
  /**
   * Error to display. The error is displayed only if `isError` is true.
   */
  error?: Error | null;
  title: string;
  fileSizeLimit?: number;
  decompress?: string;
  downloadUrl: string;
}

export const PlainTextViewer = ({
  content,
  title,
  fileSizeLimit,
  decompress,
  downloadUrl,
  isLoading,
  isError,
  error,
}: PlainTextViewerProps) => {
  const lines = content ? content.split(/\r?\n/) : [];
  const buffer = Buffer.from(content || '', 'ascii');

  const contents = () => {
    if (isLoading) {
      return (
        <Box alignItems="center" display="flex" height={1}>
          <CenterLoader />
        </Box>
      );
    }

    if (isError) {
      return <Alert severity="error">{error?.message || 'Failed to view the contents'}</Alert>;
    }

    return (
      <>
        <ViewerHeader
          decompress={decompress}
          downloadUrl={downloadUrl}
          fileSizeLimit={fileSizeLimit}
          lines={lines}
          title={title}
          transferredSize={buffer.length}
        />
        <ViewerContent lines={lines} />
      </>
    );
  };

  return (
    <Box alignItems="stretch" display="flex" height="100vh" padding={3} width="100vw">
      <Paper
        css={css`
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        `}
      >
        {contents()}
      </Paper>
    </Box>
  );
};
