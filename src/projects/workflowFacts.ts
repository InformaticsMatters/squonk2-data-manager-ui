import {
  type RunningWorkflowGetResponseStatus,
  type RunningWorkflowSummaryStatus,
} from "@/api/data-manager";

import { type InstanceId, isInstanceId } from "../routing/identifiers";
import {
  classifyProgressReadFailure,
  pendingPollIntervalMs,
  progressUnknownReason,
  type ResultProgressReadFailure,
  type ResultSettlement,
  unconfirmedPollIntervalMs,
} from "./resultProgress";

/**
 * The Data Manager running-workflow fields a Results workflow accounts for itself with. Both the
 * summary a project's own collection returns and the addressed workflow's own read carry them, so
 * a listed workflow and the one on its own route are decided by the same facts.
 */
export type ResultWorkflowFacts = {
  error_msg?: string;
  error_num?: number;
  status: RunningWorkflowGetResponseStatus | RunningWorkflowSummaryStatus;
};

/**
 * What is known about one running workflow's progress right now. A read that did not answer says
 * so through the failure every Results progress read shares, and a status this client has no rule
 * for is `unknown` for the same reason: neither is ever a finished workflow.
 */
export type ResultWorkflowLifecycle =
  | ResultProgressReadFailure
  | { kind: "failed"; reason: string }
  | { kind: "pending" }
  | { kind: "stopped"; reason: string }
  | { kind: "succeeded" }
  | { kind: "unestablished" };

/**
 * What the workflow's own status says about it. The Data Manager decides a running workflow's
 * outcome and states it outright, so nothing is inferred from its steps: `SUCCESS` is the only
 * status that reads as success, and an error the workflow recorded outranks it, which is the case
 * a status alone would report as a completed run. A workflow a caller stopped is neither a success
 * nor a failure, and a status this client has no rule for establishes nothing at all.
 */
const classifyWorkflowStatus = (workflow: ResultWorkflowFacts): ResultWorkflowLifecycle => {
  const failure = (): ResultWorkflowLifecycle => ({
    kind: "failed",
    reason: workflow.error_msg ?? "This workflow reported a failure.",
  });

  switch (workflow.status) {
    case "FAILURE":
      return failure();
    case "RUNNING":
      return { kind: "pending" };
    case "SUCCESS":
      return workflow.error_num ? failure() : { kind: "succeeded" };
    case "USER_STOPPED":
      return { kind: "stopped", reason: "This workflow was stopped before it finished." };
    default:
      return { kind: "unknown", reason: progressUnknownReason("workflow") };
  }
};

/**
 * What one workflow's own read says about it. A workflow that has settled stays settled, so a
 * later failed refresh cannot unsettle it; one that has not settled and whose read failed is
 * reported by that failure rather than by the progress it last showed.
 */
export const resolveResultWorkflowLifecycle = ({
  workflow,
  workflowError,
}: {
  workflow?: ResultWorkflowFacts;
  workflowError?: unknown;
}): ResultWorkflowLifecycle => {
  const progress = workflow === undefined ? undefined : classifyWorkflowStatus(workflow);
  if (progress !== undefined && progress.kind !== "pending" && progress.kind !== "unknown") {
    return progress;
  }
  if (workflowError !== undefined && workflowError !== null) {
    return classifyProgressReadFailure(workflowError, "workflow");
  }
  return progress ?? { kind: "unestablished" };
};

/** Only a workflow still running is polled, and a read that failed transiently backs off. */
export const resultWorkflowPollInterval = (lifecycle: ResultWorkflowLifecycle): number | false => {
  if (lifecycle.kind === "pending") {
    return pendingPollIntervalMs;
  }
  return lifecycle.kind === "unconfirmed" ? unconfirmedPollIntervalMs : false;
};

/**
 * Whether the workflow has accounted for itself. Only a workflow the Data Manager finished is
 * settled; one still running is pending; and progress that could not be read at all establishes
 * nothing, which is a different thing from a workflow known to be running.
 */
export type ResultWorkflowSettlement = ResultSettlement;

export const resultWorkflowSettlement = (
  lifecycle: ResultWorkflowLifecycle,
): ResultWorkflowSettlement => {
  switch (lifecycle.kind) {
    case "failed":
    case "stopped":
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
 * Which of the two requests the Data Manager takes for a running workflow this one can answer: it
 * stops a workflow that is still running and deletes one that has finished. Progress that
 * established nothing offers neither, because either request would be a guess about a workflow
 * this client cannot account for.
 */
export const resultWorkflowLifecycleAction = (
  lifecycle: ResultWorkflowLifecycle,
): "delete" | "stop" | undefined => {
  switch (resultWorkflowSettlement(lifecycle)) {
    case "pending":
      return "stop";
    case "settled":
      return "delete";
    case "unestablished":
      return undefined;
  }
};

/**
 * The instance one workflow step ran as, where this client can address it. A step that named no
 * instance, or one whose identity this client cannot address, produces no link rather than one it
 * invented; the project such a link is built in is the workflow's own owning project.
 */
export const resultWorkflowStepInstance = (step: {
  instance_id?: string;
}): InstanceId | undefined =>
  step.instance_id !== undefined && isInstanceId(step.instance_id) ? step.instance_id : undefined;
