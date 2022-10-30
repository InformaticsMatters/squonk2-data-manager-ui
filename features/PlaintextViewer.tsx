/* eslint-disable simple-import-sort/imports */
import { Box, Chip, Divider, Paper, Typography } from "@mui/material";
import { filesize } from "filesize";

import { useEffect } from "react";

import Head from "next/head";
import Prism from "prismjs";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";

export interface PlaintextViewerProps {
  /**
   * Contents of a file to be displayed.
   */
  content: string;
  /**
   *
   */
  title: string;
  originalContentLength: number | null;
  truncated: boolean;
  compressed: boolean;
}

/**
 * Component which displays contents of a file. The contents are provided as string, which is then
 * parsed into multiple lines and displayed.
 */
export const PlaintextViewer = ({
  content,
  title,
  originalContentLength,
  truncated,
  compressed,
}: PlaintextViewerProps) => {
  const numberOfLines = content.split("\n").length;
  const linesText = numberOfLines === 1 ? "line" : "lines";

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Paper sx={{ marginY: 2 }}>
        <Box
          alignItems="center"
          display="flex"
          paddingX={2}
          paddingY={1}
          sx={{
            bgcolor: (theme) => (theme.palette.mode === "light" ? "grey.200" : "grey.900"),
            boxShadow: 0,
            gap: 2,
          }}
        >
          <Box alignItems="center" display="flex" flex="1 1 auto" sx={{ gap: 1 }}>
            <Typography component="h1" fontFamily="monospace" sx={{ wordBreak: "break-all" }}>
              <b>{title}</b>
            </Typography>
            <Divider flexItem orientation="vertical" />
            <Typography>
              {numberOfLines} {linesText} of{" "}
              {originalContentLength ? filesize(originalContentLength) : "unknown"}
            </Typography>
            {(compressed || truncated) && <Divider flexItem orientation="vertical" />}
            {compressed && <Chip label="Decompressed" size="small" variant="outlined" />}
            {truncated && <Chip label="Truncated" size="small" variant="outlined" />}
          </Box>
        </Box>
        <Box paddingBottom={1} paddingX={1}>
          <Box className="line-numbers" component="pre" sx={{ overflowX: "auto" }}>
            <code className="language-">{content}</code>
          </Box>
        </Box>
      </Paper>
    </>
  );
};
