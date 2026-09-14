import { Alert, Button, LinearProgress, Typography } from "@mui/material";

import {
  datasetUploadIsRetryable,
  type DatasetUploadRecord,
  type DatasetUploadState,
} from "../../datasets/uploadLifecycle";

export interface DatasetUploadProgressProps {
  /** What the caller called the thing being uploaded, used in the success line and retry label. */
  name: string;
  onRetry: () => void;
  record: DatasetUploadRecord;
  state: DatasetUploadState;
}

/**
 * How one upload is going, said the same way wherever a dataset is uploaded.
 *
 * A new dataset and a new version of one differ in what they name and what they are billed to, not
 * in how the Data Manager answers, so both report their request, their task, their failure, and
 * their retry through this one presenter.
 */
export const DatasetUploadProgress = ({
  name,
  onRetry,
  record,
  state,
}: DatasetUploadProgressProps) => {
  const busy =
    state.kind === "sending" ||
    state.kind === "accepted" ||
    state.kind === "processing" ||
    state.kind === "processing-unconfirmed";
  // A determinate bar needs a proportion the request actually reported; everything else the upload
  // is busy with has no measure, so it shows an indeterminate one.
  const measuredProgress =
    state.kind === "sending" && state.progress > 0 && state.progress < 100
      ? state.progress
      : undefined;

  return (
    <>
      {measuredProgress === undefined ? null : (
        <LinearProgress value={measuredProgress} variant="determinate" />
      )}
      {busy && measuredProgress === undefined ? <LinearProgress /> : null}
      {state.kind === "processing-unconfirmed" && (
        <Typography color="text.secondary" variant="body2">
          {state.reason}
        </Typography>
      )}
      {state.kind === "processed" && (
        <Typography color="success.main" variant="body2">
          {name} uploaded and processed.
        </Typography>
      )}
      {datasetUploadIsRetryable(record) && "reason" in record ? (
        <Alert
          action={
            <Button
              aria-label={`Retry ${name}`}
              color="inherit"
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onRetry();
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
    </>
  );
};
