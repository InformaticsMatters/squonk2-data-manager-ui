import { Fragment } from 'react';

import type { Error as DMError } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import { Box, Paper } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import type { AxiosError } from 'axios';

import { CenterLoader } from '../CenterLoader';
import { ViewerContent } from './ViewerContent';
import { ViewerHeader } from './ViewerHeader';

export interface PlainTextViewProps {
  data?: string;
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
  error?: void | AxiosError<DMError> | null;
  fileSizeLimit?: string | string[];
  decompress?: string | string[];
}

export const PlainTextViewer = ({
  data,
  isLoading,
  isError,
  error,
  fileSizeLimit,
  decompress,
}: PlainTextViewProps) => {
  const lines = data ? data.split(/\r?\n/) : [];
  const buffer = Buffer.from(data || '');

  const contents = () => {
    if (isLoading) {
      return (
        <Box alignItems="center" display="flex" height={1}>
          <CenterLoader />
        </Box>
      );
    }

    if (isError) {
      return <Alert severity="error">{error?.response?.data.error}</Alert>;
    }

    return (
      <>
        <ViewerHeader
          decompress={decompress}
          fileSizeLimit={fileSizeLimit}
          lines={lines}
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
