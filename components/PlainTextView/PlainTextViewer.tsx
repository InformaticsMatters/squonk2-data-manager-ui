import { Fragment } from 'react';
import type { GridCellRenderer } from 'react-virtualized';
import { AutoSizer, Grid } from 'react-virtualized';

import type { Error as DMError } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import { GetApp } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import type { AxiosError } from 'axios';
import fileSize from 'filesize';

import { CenterLoader } from '../CenterLoader';

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
  const theme = useTheme();

  const lines = data ? data.split(/\r?\n/) : [];
  const buffer = Buffer.from(data || '');

  const cellRenderer: GridCellRenderer = ({ columnIndex, rowIndex, style, key }) => {
    if (columnIndex === 0) {
      return (
        <Typography
          align="right"
          component="pre"
          css={css`
            padding-right: ${theme.spacing(2)}px;
            color: ${theme.palette.grey[400]};
          `}
          key={key}
          style={style}
        >
          {rowIndex + 1}
        </Typography>
      );
    }
    return (
      <Typography component="pre" key={key} style={style}>
        {lines[rowIndex]}
      </Typography>
    );
  };

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
        <Box
          css={css`
            background: ${theme.palette.grey[200]};
            box-shadow: ${theme.shadows[0]};
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
              {lines.length} lines ({fileSize(buffer.length)})
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
        <Box flex="1 1 auto">
          <AutoSizer>
            {({ width, height }) => {
              return (
                <Grid
                  autoContainerWidth
                  cellRenderer={cellRenderer}
                  columnCount={2}
                  columnWidth={({ index }) => {
                    const numberWidth = String(lines.length + 1).length * 10 + theme.spacing(2);
                    if (index === 0) {
                      return numberWidth;
                    }
                    return width - numberWidth - 2 * theme.spacing(2) - 1;
                  }}
                  css={css`
                    overflow-x: auto !important;
                    padding: 0 ${theme.spacing(2)}px;
                    & pre {
                      font-family: 'Fira Mono', monospace;
                    }
                    & > div {
                      overflow: visible !important;
                    }
                  `}
                  height={height}
                  overscanRowCount={2}
                  rowCount={lines.length}
                  rowHeight={18}
                  style={{ padding: `0 ${theme.spacing(2)}px` }}
                  width={width}
                />
              );
            }}
          </AutoSizer>
        </Box>
      </>
    );
  };

  return (
    <Box alignItems="stretch" display="flex" minHeight="100vh" padding={3}>
      <Paper
        css={css`
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        `}
      >
        {contents()}
      </Paper>
    </Box>
  );
};
