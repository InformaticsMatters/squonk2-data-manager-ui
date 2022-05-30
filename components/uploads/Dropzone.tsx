import type { FC } from "react";
import { useCallback } from "react";
import type { DropzoneOptions, FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";

import { Divider, styled } from "@mui/material";
import { v4 as uuidv4 } from "uuid";

import { useFileExtensions } from "../../hooks/useFileExtensions";
import { useMimeTypeLookup } from "../../hooks/useMimeTypeLookup";
import type { UploadableFile } from "./types";
import { getMimeFromFileName } from "./utils";

export interface DropzoneProps extends DropzoneOptions {
  /**
   * The current files a user has dropped
   */
  files: UploadableFile[];
  /**
   * Called when new files are added
   */
  onNewFiles: (newFiles: UploadableFile[]) => void;
}

/**
 * The user can drag-and-drop files into a region
 */
export const Dropzone: FC<DropzoneProps> = ({
  children,
  files,
  onNewFiles,
  ...dropzoneOptions
}) => {
  const { mapping } = useFileExtensions();
  const mimeLookup = useMimeTypeLookup();

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const mappedAccepted = acceptedFiles.map((file) => ({
        file,
        mimeType: getMimeFromFileName(file.name, mimeLookup),
        errors: [],
        // Give files UUIDs to keep track
        id: uuidv4(),
        progress: 0,
        taskId: null,
        done: false,
      }));
      const mappedRejected = rejectedFiles.map((rejection) => ({
        ...rejection,
        mimeType: getMimeFromFileName(rejection.file.name, mimeLookup),
        id: uuidv4(),
        progress: 0,
        taskId: null,
        done: false,
      }));

      // TODO: merge the previous files better as this currently overwrites instead of append
      onNewFiles([...mappedAccepted, ...mappedRejected]);
    },
    [mimeLookup, onNewFiles],
  );

  // Allow .gz files
  // 1. Browsers limit file selection in native OS file selector to single extensions
  // So .sdf.gz doesn't work but .gz specifies anything ending in .gz
  //
  // 2. This currently requires the body parser in the proxy to be disabled
  // https://github.com/stegano/next-http-proxy-middleware/issues/33
  mapping["gzip"] = [".gz"];
  const { getRootProps, getInputProps } = useDropzone({
    ...dropzoneOptions,
    onDrop,
    accept: mapping,
  });

  return (
    <Zone {...getRootProps()}>
      <input {...getInputProps()} />
      <UploadButton>Drag and drop files here, or click to select files</UploadButton>
      {!!files.length && children && <Divider sx={{ my: 2 }} />}
      {children}
    </Zone>
  );
};

const Zone = styled("div", { shouldForwardProp: (prop) => prop !== "isDragActive" })<{
  isDragActive: boolean;
}>(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[600]}`,
  borderRadius: 2 * Number(theme.shape.borderRadius),
  padding: theme.spacing(1),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  overflowY: "scroll",
  maxHeight: "40vh",
}));

const UploadButton = styled("button")(({ theme }) => ({
  textTransform: "none",
  cursor: "pointer",
  textAlign: "center",
  border: "none",
  background: "none",
  display: "block",
  width: "100%",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  fontSize: "1rem",
}));
