import { useRef } from "react";
import { type FileError } from "react-dropzone";

import { Grid, IconButton, MenuItem, TextField, Typography } from "@mui/material";

import { TwiddleIcon } from "../../components/uploads/TwiddleIcon";
import { type UploadableFile } from "../../components/uploads/types";
import { type DatasetUploadRecord } from "../../datasets/uploadLifecycle";
import { useDatasetUploadState } from "../../datasets/useDatasetUploadState";
import { useFileExtensions } from "../../hooks/useFileExtensions";
import { useMimeTypeLookup } from "../../hooks/useMimeTypeLookup";
import { separateFileExtensionFromFileName } from "../../utils/app/files";
import { DatasetUploadProgress } from "./DatasetUploadProgress";

export interface SingleFileUploadWithProgressProps {
  errors: FileError[];
  fileWrapper: UploadableFile;
  record: DatasetUploadRecord;
  changeMimeType: (newType: string) => void;
  onDelete: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  /** Called once, when this file's own task has answered for good. */
  onSettled: (fileId: string, settled: DatasetUploadRecord) => void;
  rename: (newName: string) => void;
}

export const SingleFileUploadWithProgress = ({
  changeMimeType,
  errors,
  fileWrapper,
  onDelete,
  onRetry,
  onSettled,
  record,
  rename,
}: SingleFileUploadWithProgressProps) => {
  const fileNameRef = useRef<HTMLInputElement>(null);
  const fileExtRef = useRef<HTMLInputElement>(null);
  const { extensions } = useFileExtensions();
  const mimeLookup = useMimeTypeLookup();

  const composeNewFilePath = () => `${fileNameRef.current?.value}${fileExtRef.current?.value}`;
  const [stem, extension] = separateFileExtensionFromFileName(fileWrapper.file.name);

  const state = useDatasetUploadState({ onSettled, record, uploadId: fileWrapper.id });

  const busy =
    state.kind === "sending" ||
    state.kind === "accepted" ||
    state.kind === "processing" ||
    state.kind === "processing-unconfirmed";
  const done = state.kind === "processed";

  return (
    <>
      <Grid container spacing={1} sx={{ alignItems: "center" }}>
        <Grid size={{ md: 9, sm: 8, xs: 12 }}>
          <TextField
            fullWidth
            required
            defaultValue={stem}
            disabled={busy || done}
            inputRef={fileNameRef}
            label="File name"
            placeholder={stem}
            onChange={() => rename(composeNewFilePath())}
            onClick={(event) => event.stopPropagation()}
          />
        </Grid>

        <Grid size={{ md: 2, sm: 3, xs: 8 }} sx={{ textAlign: "center" }}>
          <TextField
            fullWidth
            select
            defaultValue={extension}
            disabled={busy || done}
            inputRef={fileExtRef}
            label="Ext"
            onChange={(event) => {
              event.stopPropagation();
              rename(composeNewFilePath());
              changeMimeType(mimeLookup[event.target.value]);
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {extensions.map((fileType) => (
              <MenuItem key={fileType} value={fileType}>
                {fileType}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ md: 1, sm: 1, xs: 4 }} sx={{ textAlign: "center" }}>
          <IconButton
            aria-label={`Remove ${fileWrapper.file.name}`}
            disabled={busy}
            size="small"
            sx={{ color: "success.main" }}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(fileWrapper.id);
            }}
          >
            <TwiddleIcon done={done} />
          </IconButton>
        </Grid>
      </Grid>
      <DatasetUploadProgress
        name={fileWrapper.file.name}
        record={record}
        state={state}
        onRetry={() => onRetry(fileWrapper.id)}
      />
      {errors.map((error) => (
        <Typography color="error" key={`${error.code}-${error.message}`}>
          {error.message}
        </Typography>
      ))}
    </>
  );
};
