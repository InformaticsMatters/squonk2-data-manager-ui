import { Box, Divider, Typography, useTheme } from "@mui/material";
import fileSize from "filesize";

import { DownloadButton } from "../../DownloadButton";
import { FileInfoChips } from "./FileInfoChips";
import { useGetFileInfoChips } from "./useGetFileInfoChips";

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
  const linesText = numberOfLines === 1 ? "line" : "lines";

  return (
    <Box
      alignItems="center"
      display="flex"
      paddingX={2}
      paddingY={1}
      sx={{
        background:
          theme.palette.mode === "light" ? theme.palette.grey[200] : theme.palette.grey[900],
        boxShadow: theme.shadows[0],
        borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
        gap: theme.spacing(2),
      }}
    >
      <Box alignItems="center" display="flex" flex="1 1 auto" sx={{ gap: theme.spacing() }}>
        <Typography component="h1" sx={{ wordBreak: "break-all" }}>
          <b>{title}</b>
        </Typography>
        <Divider flexItem orientation="vertical" />
        <Typography>
          {numberOfLines} {linesText} ({fileSize(transferredSize)})
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
