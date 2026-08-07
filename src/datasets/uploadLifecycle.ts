import { isAxiosError } from "axios";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";

/**
 * What is known about one file's upload without asking its task again.
 *
 * The record is what the form itself owns, keyed by the file's own identity: the request it made,
 * and — once a task has settled — the answer it gave. Promoting a settled answer into the record is
 * what lets the poll stop without the file forgetting how it ended.
 */
export type DatasetUploadRecord =
  | { kind: "accepted"; taskId: string }
  | { kind: "idle" }
  | { kind: "processed"; taskId: string }
  | { kind: "processing-failed"; reason: string; taskId: string }
  | { kind: "processing-unknown"; reason: string; taskId: string }
  | { kind: "request-failed"; reason: string }
  | { kind: "sending"; progress: number };

/**
 * The whole state of one file's upload, including what its task is saying right now.
 *
 * `processing-unconfirmed` is a status read that failed transiently: the task is still running and
 * still worth asking about. `processing-unknown` is a read this client cannot interpret or is not
 * allowed to make, so it stops asking and offers retry instead of guessing an outcome.
 */
export type DatasetUploadState =
  | DatasetUploadRecord
  | { kind: "processing-unconfirmed"; reason: string; taskId: string }
  | { kind: "processing"; taskId: string };

/** The Data Manager task fields an upload's outcome is decided by. */
export type DatasetUploadTask = {
  done: boolean;
  exit_code?: number;
  states?: readonly { message?: string; state: string }[];
};

export type DatasetUploadFacts = {
  record: DatasetUploadRecord;
  task?: DatasetUploadTask;
  taskError?: unknown;
};

const pollIntervalMs = 2000;
const unconfirmedPollIntervalMs = 8000;

/**
 * The Data Manager states the rule outright: an upload is complete when its task is done with an
 * exit code of zero, and failed when it is done with anything else. A missing exit code on a done
 * task is therefore a failure, never an assumed success. A task that also recorded a `FAILURE`
 * state is a domain failure even where its exit code alone would have read as success, and that
 * state's own message is what the Data Manager wanted said about it.
 */
const classifySettledTask = (task: DatasetUploadTask, taskId: string): DatasetUploadState => {
  if (task.exit_code !== 0) {
    return {
      kind: "processing-failed",
      reason:
        task.exit_code === undefined
          ? "Dataset processing finished without reporting an exit code."
          : `Dataset processing failed with exit code ${task.exit_code}.`,
      taskId,
    };
  }
  const failure = task.states?.findLast(({ state }) => state === "FAILURE");
  if (failure) {
    return {
      kind: "processing-failed",
      reason: failure.message ?? "Dataset processing reported a failure.",
      taskId,
    };
  }
  return { kind: "processed", taskId };
};

/**
 * Why the Data Manager did not accept an upload.
 *
 * A refusal carries the Data Manager's own words where it gave any, because it knows things this
 * client does not — an unsupported type, a name it will not take, an unfunded unit. Anything else
 * is described by its transport classification rather than by reading a message this client cannot
 * interpret. Every refusal is retryable: none of them created a task.
 */
export const datasetUploadRequestFailure = (error: unknown): DatasetUploadRecord => {
  const failure = classifyTransportFailure(error);
  // A transport that failed on the way explains nothing about this upload, so whatever body came
  // back with it is not a reason the caller can act on.
  if (["network", "rate-limited", "server", "timeout"].includes(failure.kind)) {
    return { kind: "request-failed", reason: "This upload could not be sent. Retry this file." };
  }
  const reported =
    isAxiosError<{ error?: string }>(error) && typeof error.response?.data.error === "string"
      ? error.response.data.error
      : undefined;
  if (reported) {
    return { kind: "request-failed", reason: reported };
  }
  return {
    kind: "request-failed",
    reason:
      failure.kind === "forbidden"
        ? "You are not allowed to upload a dataset to this unit."
        : "The Data Manager refused this upload.",
  };
};

/** A read that may succeed next time keeps the file processing; anything else stops the poll. */
const classifyTaskReadFailure = (taskError: unknown, taskId: string): DatasetUploadState => {
  const failure = classifyTransportFailure(taskError);
  return ["network", "rate-limited", "server", "timeout"].includes(failure.kind)
    ? {
        kind: "processing-unconfirmed",
        reason: "Upload progress could not be read. This file is still being processed.",
        taskId,
      }
    : {
        kind: "processing-unknown",
        reason: "Upload progress could not be established. Retry this file to check it again.",
        taskId,
      };
};

export const classifyDatasetUpload = ({
  record,
  task,
  taskError,
}: DatasetUploadFacts): DatasetUploadState => {
  if (record.kind !== "accepted") {
    return record;
  }
  if (task?.done) {
    return classifySettledTask(task, record.taskId);
  }
  if (taskError !== undefined && taskError !== null) {
    return classifyTaskReadFailure(taskError, record.taskId);
  }
  return { kind: "processing", taskId: record.taskId };
};

/** Only a file that is waiting on a task is polled, and an unconfirmed read backs off first. */
export const datasetUploadPollInterval = (state: DatasetUploadState): number | false => {
  if (state.kind === "processing") {
    return pollIntervalMs;
  }
  return state.kind === "processing-unconfirmed" ? unconfirmedPollIntervalMs : false;
};

/** What a live state is worth writing back into the record it was derived from. */
export const settleDatasetUpload = (state: DatasetUploadState): DatasetUploadRecord | undefined =>
  state.kind === "processed" ||
  state.kind === "processing-failed" ||
  state.kind === "processing-unknown"
    ? state
    : undefined;

/**
 * Whether the batch is now bound to the billing unit it started with.
 *
 * A batch commits as soon as one of its files reaches the Data Manager, because from then on a
 * different unit would bill part of the same batch elsewhere. A request the Data Manager refused
 * reached nothing and created no task, so a batch that only failed is still free to choose again.
 */
export const datasetUploadBatchIsCommitted = (records: DatasetUploadRecords): boolean =>
  Object.values(records).some(
    (record) => record.kind === "sending" || record.kind === "accepted" || "taskId" in record,
  );

export const datasetUploadIsRetryable = (record: DatasetUploadRecord): boolean =>
  record.kind === "processing-failed" ||
  record.kind === "processing-unknown" ||
  record.kind === "request-failed";

export type DatasetUploadRecords = Readonly<Record<string, DatasetUploadRecord>>;

const idle: DatasetUploadRecord = { kind: "idle" };

export const datasetUploadRecordOf = (
  records: DatasetUploadRecords,
  fileId: string,
): DatasetUploadRecord => records[fileId] ?? idle;

/**
 * Records are addressed by the file's own identity and replaced functionally, so two files whose
 * request progress and acceptance arrive in any order never overwrite one another's answer and no
 * update depends on a position in a list that may have changed underneath it.
 */
export const withDatasetUploadRecord = (
  records: DatasetUploadRecords,
  fileId: string,
  next: DatasetUploadRecord | ((current: DatasetUploadRecord) => DatasetUploadRecord),
): DatasetUploadRecords => ({
  ...records,
  [fileId]: typeof next === "function" ? next(datasetUploadRecordOf(records, fileId)) : next,
});

/** Retry returns a failed file to the start; a file that succeeded is never sent a second time. */
export const retryDatasetUpload = (
  records: DatasetUploadRecords,
  fileId: string,
): DatasetUploadRecords =>
  withDatasetUploadRecord(records, fileId, (current) =>
    datasetUploadIsRetryable(current) ? idle : current,
  );

/**
 * Which files a submission sends: those that have never been accepted and those whose last attempt
 * can be retried. Successful files are excluded, so a retry after a partial failure does not
 * re-enter work the Data Manager has already done.
 */
export const pendingUploadFileIds = (
  files: readonly { id: string }[],
  records: DatasetUploadRecords,
): string[] =>
  files
    .filter(({ id }) => {
      const record = datasetUploadRecordOf(records, id);
      return record.kind === "idle" || datasetUploadIsRetryable(record);
    })
    .map(({ id }) => id);

/** Records outlive neither their file nor a reset of the form. */
export const resetDatasetUploads = (
  records: DatasetUploadRecords,
  files: readonly { id: string }[],
): DatasetUploadRecords =>
  Object.fromEntries(
    Object.entries(records).filter(([fileId]) => files.some(({ id }) => id === fileId)),
  );
