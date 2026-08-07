import { useEffect, useRef } from "react";
import { type FileError } from "react-dropzone";

import { useGetTask } from "@/api/data-manager/task";

import {
  Alert,
  Button,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { TwiddleIcon } from "../../components/uploads/TwiddleIcon";
import { type UploadableFile } from "../../components/uploads/types";
import {
  classifyDatasetUpload,
  datasetUploadIsRetryable,
  datasetUploadPollInterval,
  type DatasetUploadRecord,
  settleDatasetUpload,
} from "../../datasets/uploadLifecycle";
import { useFileExtensions } from "../../hooks/useFileExtensions";
import { useMimeTypeLookup } from "../../hooks/useMimeTypeLookup";
import { separateFileExtensionFromFileName } from "../../utils/app/files";

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

  const taskId = "taskId" in record ? record.taskId : undefined;
  const { data: task, error } = useGetTask(taskId ?? "", undefined, {
    query: {
      enabled: record.kind === "accepted",
      // The interval is asked of the same classifier the display uses, so a file that is only
      // temporarily unreadable keeps being polled while an uninterpretable answer stops.
      refetchInterval: (query) =>
        datasetUploadPollInterval(
          classifyDatasetUpload({ record, task: query.state.data, taskError: query.state.error }),
        ),
      retry: false,
    },
  });

  const state = classifyDatasetUpload({ record, task, taskError: error });

  useEffect(() => {
    // A record that already carries its outcome is never settled again, which is what keeps this
    // effect from answering its own update.
    if (settleDatasetUpload(record)) {
      return;
    }
    const settled = settleDatasetUpload(state);
    if (settled) {
      onSettled(fileWrapper.id, settled);
    }
  }, [fileWrapper.id, onSettled, record, state]);

  const busy =
    state.kind === "sending" ||
    state.kind === "accepted" ||
    state.kind === "processing" ||
    state.kind === "processing-unconfirmed";
  const done = state.kind === "processed";
  const retryable = datasetUploadIsRetryable(record);
  // A determinate bar needs a proportion the request actually reported; everything else the file is
  // busy with has no measure, so it shows an indeterminate one.
  const measuredProgress =
    state.kind === "sending" && state.progress > 0 && state.progress < 100
      ? state.progress
      : undefined;

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
      {measuredProgress === undefined ? null : (
        <LinearProgress value={measuredProgress} variant="determinate" />
      )}
      {busy && measuredProgress === undefined ? <LinearProgress /> : null}
      {state.kind === "processing-unconfirmed" && (
        <Typography color="text.secondary" variant="body2">
          {state.reason}
        </Typography>
      )}
      {!!done && (
        <Typography color="success.main" variant="body2">
          {fileWrapper.file.name} uploaded and processed.
        </Typography>
      )}
      {retryable && "reason" in record ? (
        <Alert
          action={
            <Button
              aria-label={`Retry ${fileWrapper.file.name}`}
              color="inherit"
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onRetry(fileWrapper.id);
              }}
            >
              Retry
            </Button>
          }
          severity="error"
          sx={{ mt: 1 }}
        >
          {record.reason}
        </Alert>
      ) : null}
      {errors.map((error) => (
        <Typography color="error" key={`${error.code}-${error.message}`}>
          {error.message}
        </Typography>
      ))}
    </>
  );
};
