import { type DatasetVersionSummary } from "@/api/data-manager";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";

export type DatasetDeletionTask = { done: boolean; exit_code?: number };
export type DatasetDeletionDestination =
  | { status: "list" }
  | { status: "version"; version: number };

export class DatasetDeletionError extends Error {
  constructor(
    message: string,
    readonly taskId: string,
  ) {
    super(message);
    this.name = "DatasetDeletionError";
  }
}

export class DatasetDeletionPollingError extends Error {
  constructor(readonly taskId: string) {
    super("Dataset deletion is still in progress.");
    this.name = "DatasetDeletionPollingError";
  }
}

export const datasetDeletionLifecycle = (
  task: DatasetDeletionTask | undefined,
): { status: "failed"; exitCode?: number } | { status: "pending" } | { status: "succeeded" } => {
  if (!task?.done) {
    return { status: "pending" };
  }
  return task.exit_code === 0
    ? { status: "succeeded" }
    : { status: "failed", exitCode: task.exit_code };
};

export const nextVersionAfterDeletion = (
  versions: readonly DatasetVersionSummary[],
  deletedVersion: number,
): DatasetDeletionDestination => {
  const nextVersion = versions
    .filter(({ version }) => version !== deletedVersion)
    .map(({ version }) => version)
    .toSorted((left, right) => right - left)
    .at(0);
  return nextVersion === undefined
    ? { status: "list" }
    : { status: "version", version: nextVersion };
};

export const datasetMutationFailureMessage = (
  error: unknown,
  action: string,
  datasetId: string,
  datasetVersion: number,
) => {
  if (error instanceof DatasetDeletionError || error instanceof DatasetDeletionPollingError) {
    return `${error.message} Task ${error.taskId}. The displayed dataset version has not changed; retry is available.`;
  }
  const failure = classifyTransportFailure(error);
  if (failure.kind === "forbidden") {
    return `You no longer have permission to ${action} dataset ${datasetId} version ${datasetVersion}. The displayed dataset version has not changed.`;
  }
  if (["network", "rate-limited", "server", "timeout"].includes(failure.kind)) {
    return `Could not ${action} dataset ${datasetId} version ${datasetVersion}. The displayed dataset version has not changed; retry is available.`;
  }
  return undefined;
};
