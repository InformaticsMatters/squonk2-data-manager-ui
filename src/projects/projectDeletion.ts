import { isProjectId, isTaskId, type ProjectId, type TaskId } from "../routing/identifiers";
import { type ResultTaskLifecycle } from "./taskFacts";

/** What one deletion is for: the project to remove, and the subscription that outlives it. */
export type ProjectDeletionInput = { productId?: string; projectId: string };

/**
 * The cross-service deletion lifecycle.
 *
 * The Data Manager phase and the Account Server phase are distinct throughout, because they answer
 * for different systems and only one of them may follow the other. Nothing but a deletion task the
 * Data Manager confirmed done with an exit code of zero reaches the subscription phase: a nonzero
 * exit, a domain failure, and a result this client cannot interpret all stop there, so failed
 * project cleanup can never destroy the billing record that describes it.
 */
export type ProjectDeletionState =
  | { input: ProjectDeletionInput; kind: "request-failed"; reason: string }
  | { input: ProjectDeletionInput; kind: "requesting" }
  | { kind: "cleaning-up"; productId: string; taskId: string }
  | { kind: "cleanup-failed"; productId: string; reason: string; taskId: string }
  | { kind: "collecting" }
  | { kind: "completed"; productId?: string; taskId: string }
  | { kind: "delete-failed"; productId?: string; reason: string; taskId: string }
  | { kind: "delete-unconfirmed"; productId?: string; reason: string; taskId: string }
  | { kind: "delete-unusable"; productId?: string; reason: string; taskId: string }
  | { kind: "polling"; productId?: string; taskId: string };

export type ProjectDeletionEffect =
  | { kind: "delete-project"; projectId: string }
  | { kind: "delete-subscription"; productId: string }
  | { kind: "read-deletion-task"; taskId: string };

type ProjectDeletionEvent =
  | { input: ProjectDeletionInput; kind: "request" }
  | { kind: "cleanup-failed"; reason: string }
  | { kind: "cleanup-succeeded" }
  | { kind: "progress"; lifecycle: ResultTaskLifecycle }
  | { kind: "request-failed"; reason: string }
  | { kind: "requested"; taskId: string }
  | { kind: "retry" };

export type ProjectDeletionTransition = {
  effect?: ProjectDeletionEffect;
  state: ProjectDeletionState;
};

export const initialProjectDeletionState: ProjectDeletionState = { kind: "collecting" };

/**
 * Where the canonical progress route starts from. The task and the subscription it carries are the
 * whole identity of the workflow, so a reload resumes the same deletion the request left behind
 * without a record of any kind having survived with it.
 */
export const pollingProjectDeletionState = (
  taskId: string,
  productId: string | undefined,
): ProjectDeletionState => ({ kind: "polling", taskId, ...(productId ? { productId } : {}) });

type WatchingDeletion = Extract<
  ProjectDeletionState,
  { kind: "delete-unconfirmed" | "delete-unusable" | "polling" }
>;

/** The states that are still describing an unsettled Data Manager deletion. */
const watchesDeletion = (state: ProjectDeletionState): state is WatchingDeletion =>
  state.kind === "polling" ||
  state.kind === "delete-unconfirmed" ||
  state.kind === "delete-unusable";

const settle = (
  state: WatchingDeletion,
  lifecycle: ResultTaskLifecycle,
): ProjectDeletionTransition => {
  const { productId, taskId } = state;
  const carried = productId ? { productId } : {};
  switch (lifecycle.kind) {
    case "succeeded":
      // The one transition that may reach the Account Server, and only ever from here.
      return productId
        ? {
            effect: { kind: "delete-subscription", productId },
            state: { kind: "cleaning-up", productId, taskId },
          }
        : { state: { kind: "completed", taskId, ...carried } };
    case "failed":
      return { state: { kind: "delete-failed", reason: lifecycle.reason, taskId, ...carried } };
    case "unconfirmed":
      return {
        state: { kind: "delete-unconfirmed", reason: lifecycle.reason, taskId, ...carried },
      };
    case "unknown":
      return { state: { kind: "delete-unusable", reason: lifecycle.reason, taskId, ...carried } };
    // A task still running and one whose read has not answered yet both describe a deletion that
    // has not settled, which is exactly what the workflow is already waiting for.
    case "pending":
    case "unestablished":
      return { state: { kind: "polling", taskId, ...carried } };
  }
};

/**
 * The lifecycle. Every phase that failed offers only what is safe to send again: a refused request
 * may be sent again because a deletion request creates nothing, an unreadable task may be read
 * again because reading changes nothing, and a failed subscription cleanup may be attempted again
 * because it addresses a subscription the project no longer holds. A deletion the Data Manager
 * settled is never restarted or reinterpreted, so no later event can reopen it.
 */
export const transitionProjectDeletion = (
  state: ProjectDeletionState,
  event: ProjectDeletionEvent,
): ProjectDeletionTransition => {
  if (event.kind === "request" && state.kind === "collecting") {
    return {
      effect: { kind: "delete-project", projectId: event.input.projectId },
      state: { input: event.input, kind: "requesting" },
    };
  }
  if (event.kind === "requested" && state.kind === "requesting") {
    return { state: pollingProjectDeletionState(event.taskId, state.input.productId) };
  }
  if (event.kind === "request-failed" && state.kind === "requesting") {
    return { state: { input: state.input, kind: "request-failed", reason: event.reason } };
  }
  if (event.kind === "progress" && watchesDeletion(state)) {
    return settle(state, event.lifecycle);
  }
  if (event.kind === "cleanup-succeeded" && state.kind === "cleaning-up") {
    return { state: { kind: "completed", productId: state.productId, taskId: state.taskId } };
  }
  if (event.kind === "cleanup-failed" && state.kind === "cleaning-up") {
    return {
      state: {
        kind: "cleanup-failed",
        productId: state.productId,
        reason: event.reason,
        taskId: state.taskId,
      },
    };
  }
  if (event.kind === "retry" && state.kind === "request-failed") {
    return {
      effect: { kind: "delete-project", projectId: state.input.projectId },
      state: { input: state.input, kind: "requesting" },
    };
  }
  if (event.kind === "retry" && state.kind === "delete-unusable") {
    return {
      effect: { kind: "read-deletion-task", taskId: state.taskId },
      state: pollingProjectDeletionState(state.taskId, state.productId),
    };
  }
  if (event.kind === "retry" && state.kind === "cleanup-failed") {
    return {
      effect: { kind: "delete-subscription", productId: state.productId },
      state: { kind: "cleaning-up", productId: state.productId, taskId: state.taskId },
    };
  }
  return { state };
};

/**
 * Whether the workflow is waiting on a service. Only a phase that is not waiting may be acted on,
 * so a request in flight, a task still being polled, and a cleanup that has not answered all
 * withhold the controls that would send a second one.
 */
export const projectDeletionIsPending = (state: ProjectDeletionState) =>
  state.kind === "requesting" ||
  state.kind === "polling" ||
  state.kind === "delete-unconfirmed" ||
  state.kind === "cleaning-up";

export const PROJECT_DELETION_RECOVERY_KEY = "data-manager-ui-project-deletion";

/**
 * The project one addressed deletion is removing.
 *
 * The canonical route already carries everything needed to resume the workflow, so this record
 * carries exactly one thing the route deliberately does not name: which project's loaded content
 * and recents a confirmed deletion must clear. It names nothing else — the subscription is the
 * route's to carry — so the record can never become a second, disagreeing account of the workflow.
 * It is kept where the content it describes is kept, so the tab that confirms a deletion is not
 * required to be the tab that started it.
 */
export type ProjectDeletionRecovery = { projectId: ProjectId; taskId: TaskId };

export const parseProjectDeletionRecovery = (
  value: unknown,
): ProjectDeletionRecovery | undefined => {
  if (typeof value !== "object" || value === null || !("version" in value) || value.version !== 1) {
    return undefined;
  }
  const record = value as { projectId?: unknown; taskId?: unknown };
  if (
    typeof record.projectId !== "string" ||
    !isProjectId(record.projectId) ||
    typeof record.taskId !== "string" ||
    !isTaskId(record.taskId)
  ) {
    return undefined;
  }
  return { projectId: record.projectId, taskId: record.taskId };
};

export const readProjectDeletionRecovery = (
  storage: Pick<Storage, "getItem">,
): ProjectDeletionRecovery | undefined => {
  try {
    const value = storage.getItem(PROJECT_DELETION_RECOVERY_KEY);
    return value === null ? undefined : parseProjectDeletionRecovery(JSON.parse(value));
  } catch {
    return undefined;
  }
};

export const rememberProjectDeletion = (
  storage: Pick<Storage, "setItem">,
  recovery: ProjectDeletionRecovery,
): boolean => {
  try {
    storage.setItem(PROJECT_DELETION_RECOVERY_KEY, JSON.stringify({ ...recovery, version: 1 }));
    return true;
  } catch {
    return false;
  }
};

export const forgetProjectDeletion = (storage: Pick<Storage, "removeItem">) => {
  try {
    storage.removeItem(PROJECT_DELETION_RECOVERY_KEY);
  } catch {
    // The record only names local content to clear, so losing it costs the workflow nothing.
  }
};
