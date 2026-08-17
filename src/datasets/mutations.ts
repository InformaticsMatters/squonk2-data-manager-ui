import { type DatasetVersionSummary } from "@/api/data-manager";

import {
  classifyTransportFailure,
  isTransientTransportFailure,
} from "../api/runtime/classifyTransportFailure";
import { latestDatasetVersion } from "./resolveDatasetVersion";

/** The Data Manager task fields any dataset command that waits on one is settled by. */
export type DatasetTask = { done: boolean; exit_code?: number };
export type DatasetDeletionDestination =
  | { status: "list" }
  | { status: "version"; version: number };

/** A dataset task the Data Manager settled with something other than success. */
export class DatasetTaskError extends Error {
  constructor(
    message: string,
    readonly taskId: string,
  ) {
    super(message);
    this.name = "DatasetTaskError";
  }
}

/** A dataset task that had not settled by the time this client stopped asking. */
export class DatasetTaskPollingError extends Error {
  constructor(
    message: string,
    readonly taskId: string,
  ) {
    super(message);
    this.name = "DatasetTaskPollingError";
  }
}

/**
 * What one Data Manager task has settled as. The Data Manager states the rule outright: a task is
 * complete when it is done with an exit code of zero, so a done task with any other code — a
 * missing one included — has failed rather than succeeded. Every dataset command that waits on a
 * task reads it here, so deletion and attachment cannot disagree about what a task said.
 */
export const datasetTaskLifecycle = (
  task: DatasetTask | undefined,
): { status: "failed"; exitCode?: number } | { status: "pending" } | { status: "succeeded" } => {
  if (!task?.done) {
    return { status: "pending" };
  }
  return task.exit_code === 0
    ? { status: "succeeded" }
    : { status: "failed", exitCode: task.exit_code };
};

/**
 * Where a deletion leaves the caller: the latest of whatever the dataset still has. The family's
 * one latest-version rule answers this too, so a deletion cannot land on a version the route would
 * then canonicalise away from.
 */
export const nextVersionAfterDeletion = (
  versions: readonly DatasetVersionSummary[],
  deletedVersion: number,
): DatasetDeletionDestination => {
  const next = latestDatasetVersion(versions.filter(({ version }) => version !== deletedVersion));
  return next === undefined ? { status: "list" } : { status: "version", version: next.version };
};

export const datasetMutationFailureMessage = (
  error: unknown,
  action: string,
  datasetId: string,
  datasetVersion: number,
) => {
  if (error instanceof DatasetTaskError || error instanceof DatasetTaskPollingError) {
    return `${error.message} Task ${error.taskId}. The displayed dataset version has not changed; retry is available.`;
  }
  if (classifyTransportFailure(error).kind === "forbidden") {
    return `You no longer have permission to ${action} dataset ${datasetId} version ${datasetVersion}. The displayed dataset version has not changed.`;
  }
  if (isTransientTransportFailure(error)) {
    return `Could not ${action} dataset ${datasetId} version ${datasetVersion}. The displayed dataset version has not changed; retry is available.`;
  }
  return undefined;
};
