import { isTransientTransportFailure } from "../api/runtime/classifyTransportFailure";
import { type DatasetId, isDatasetId } from "../routing/identifiers";

/**
 * The Data Manager task fields a Results task accounts for itself with. Both the summary a
 * project's own task collection returns and the addressed task's own read carry them, so a listed
 * task and the one on its own route are decided by the same facts.
 */
export type ResultTaskFacts = {
  done: boolean;
  exit_code?: number;
  purpose?: string;
  purpose_id?: string;
  purpose_version?: number;
  states?: readonly { message?: string; state: string }[];
};

/**
 * What is known about one task's progress right now.
 *
 * `unconfirmed` is a progress read that failed transiently: the task is still running and still
 * worth asking about, so the poll backs off rather than stopping. `unknown` is a read this client
 * cannot interpret or is not allowed to make, so it stops asking instead of guessing an outcome.
 * Neither is ever a finished task.
 */
export type ResultTaskLifecycle =
  | { kind: "failed"; reason: string }
  | { kind: "pending" }
  | { kind: "succeeded" }
  | { kind: "unconfirmed"; reason: string }
  | { kind: "unestablished" }
  | { kind: "unknown"; reason: string };

const pendingPollIntervalMs = 5000;
const unconfirmedPollIntervalMs = 15_000;

const unconfirmedReason = "This task's progress could not be read. It is still being checked.";
const unknownReason = "This task's progress could not be established. Retry to check it again.";

/**
 * The Data Manager states the rule outright: a task is complete when it is done with an exit code
 * of zero, and failed when it is done with anything else. A done task that reported no exit code is
 * therefore a failure, never an assumed success. A task that also recorded a `FAILURE` state is a
 * domain failure even where its exit code alone would have read as success, and that state's own
 * message is what the Data Manager wanted said about it.
 */
const classifySettledTask = (task: ResultTaskFacts): ResultTaskLifecycle => {
  if (task.exit_code !== 0) {
    return {
      kind: "failed",
      reason:
        task.exit_code === undefined
          ? "This task finished without reporting an exit code."
          : `This task failed with exit code ${task.exit_code}.`,
    };
  }
  const failure = task.states?.findLast(({ state }) => state === "FAILURE");
  if (failure) {
    return { kind: "failed", reason: failure.message ?? "This task reported a failure." };
  }
  return { kind: "succeeded" };
};

/** A read that may answer next time keeps the task running; anything else stops the poll. */
const classifyReadFailure = (taskError: unknown): ResultTaskLifecycle =>
  isTransientTransportFailure(taskError)
    ? { kind: "unconfirmed", reason: unconfirmedReason }
    : { kind: "unknown", reason: unknownReason };

/**
 * What one task's own read says about it. A task that has settled stays settled, so a later failed
 * refresh cannot unsettle it; a task that has not settled and whose read failed is reported by that
 * failure rather than by the progress it last showed.
 */
export const resolveResultTaskLifecycle = ({
  task,
  taskError,
}: {
  task?: ResultTaskFacts;
  taskError?: unknown;
}): ResultTaskLifecycle => {
  if (task?.done) {
    return classifySettledTask(task);
  }
  if (taskError !== undefined && taskError !== null) {
    return classifyReadFailure(taskError);
  }
  return task === undefined ? { kind: "unestablished" } : { kind: "pending" };
};

/** Only a task that is still running is polled, and a read that failed transiently backs off. */
export const resultTaskPollInterval = (lifecycle: ResultTaskLifecycle): number | false => {
  if (lifecycle.kind === "pending") {
    return pendingPollIntervalMs;
  }
  return lifecycle.kind === "unconfirmed" ? unconfirmedPollIntervalMs : false;
};

/**
 * Whether the task has accounted for itself. Only a task that finished is settled; a task still
 * running is pending; and progress that could not be read at all establishes nothing, which is a
 * different thing from a task known to be running.
 */
export type ResultTaskSettlement = "pending" | "settled" | "unestablished";

export const resultTaskSettlement = (lifecycle: ResultTaskLifecycle): ResultTaskSettlement => {
  switch (lifecycle.kind) {
    case "failed":
    case "succeeded":
      return "settled";
    case "pending":
      return "pending";
    case "unconfirmed":
    case "unestablished":
    case "unknown":
      return "unestablished";
  }
};

/**
 * What one task produced, as the task itself accounts for it.
 *
 * The Data Manager only promises that `purpose_id` is a Dataset UUID, and that `purpose_version`
 * is set at all, when the purpose is `DATASET`; a `FILE` task relates to a project file instead. So
 * only a dataset task names a dataset here, and a file task's product is addressed in the project
 * that ran it. Nothing is derived from a selected project, and an identity this client cannot
 * address produces no output rather than a link it invented.
 */
export type ResultTaskOutput = {
  dataset?: { datasetId: DatasetId; version?: number };
  projectFile: boolean;
};

export const resultTaskOutput = (
  task: Pick<ResultTaskFacts, "purpose_id" | "purpose_version" | "purpose">,
): ResultTaskOutput => {
  if (task.purpose === "FILE") {
    return { projectFile: true };
  }
  if (
    task.purpose !== "DATASET" ||
    task.purpose_id === undefined ||
    !isDatasetId(task.purpose_id)
  ) {
    return { projectFile: false };
  }
  const version = task.purpose_version;
  const addressable = version !== undefined && Number.isSafeInteger(version) && version > 0;
  return {
    dataset: { datasetId: task.purpose_id, ...(addressable ? { version } : {}) },
    projectFile: false,
  };
};
