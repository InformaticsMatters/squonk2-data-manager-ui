import { Alert, Box, Paper } from "@mui/material";
import Error from "next/error";

import { CenterLoader } from "../CenterLoader";
import { PlaintextViewerContent } from "./PlaintextViewerContent";
import { PlaintextViewerHeader } from "./PlaintextViewerHeader";
export interface PlaintextViewerProps {
  /**
   * Contents of a file to be displayed.
   */
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
  error?: string;
  /**
   * Title for the viewer, which is displayed in the header in bold.
   */
  title: string;
  /**
   * If provided, it means that only a fixed size part of the file was requested.
   */
  fileSizeLimit?: number;
  /**
   * If provided, it means that the contents of the file had to be decompressed.
   */
  decompress?: string;
  /**
   * URL where to download the original file.
   */
  downloadUrl: string;
}

/**
 * Component which displays contents of a file. The contents are provided as string, which is then
 * parsed into multiple lines and displayed.
 */
export const PlaintextViewer = ({
  content,
  title,
  fileSizeLimit,
  decompress,
  downloadUrl,
  isLoading,
  isError,
  error,
}: PlaintextViewerProps) => {
  try {
    content = JSON.stringify(content, null, 2); // content can be JSON
  } catch (error) {
    return <Error message="The JSON file was malformed" statusCode={500} />;
  }
  const lines = content ? content.split(/\r?\n/) : [];
  // By default, utf8 is assumed, used to determine whether or not the whole contents of the file
  // was fetched
  const buffer = Buffer.from(content || "");

  const contents = () => {
    if (isLoading) {
      return (
        <Box alignItems="center" display="flex" height={1}>
          <CenterLoader />
        </Box>
      );
    }

    if (isError) {
      return <Alert severity="error">{error || "Failed to view the contents"}</Alert>;
    }

    return (
      <>
        <PlaintextViewerHeader
          decompress={decompress}
          downloadUrl={downloadUrl}
          fileSizeLimit={fileSizeLimit}
          numberOfLines={lines.length}
          title={title}
          transferredSize={buffer.length}
        />
        <PlaintextViewerContent lines={lines} />
      </>
    );
  };

  return (
    <Box alignItems="stretch" display="flex" height="100vh" padding={3} width="100vw">
      <Paper sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {contents()}
      </Paper>
    </Box>
  );
};
