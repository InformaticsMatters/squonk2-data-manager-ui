import {
  type InstanceGetResponseApplicationType,
  type InstanceGetResponsePhase,
  type InstanceSummaryApplicationType,
  type InstanceSummaryPhase,
} from "@/api/data-manager";

import {
  classifyProgressReadFailure,
  pendingPollIntervalMs,
  progressUnknownReason,
  type ResultProgressReadFailure,
  type ResultSettlement,
  unconfirmedPollIntervalMs,
} from "./resultProgress";

/**
 * The Data Manager instance fields a Results instance accounts for itself with. Both the summary a
 * project's own collection returns and the addressed instance's own read carry them, so a listed
 * instance and the one on its own route are decided by the same facts.
 */
export type ResultInstanceFacts = {
  application_type?: InstanceGetResponseApplicationType | InstanceSummaryApplicationType;
  error_message?: string;
  job_id?: number;
  phase: InstanceGetResponsePhase | InstanceSummaryPhase;
};

/**
 * What is known about one instance's progress right now. A read that did not answer says so
 * through the failure every Results progress read shares, and a phase this client has no rule for
 * is `unknown` for the same reason: neither is ever a finished instance.
 *
 * `stalled` is the Data Manager's own account of an instance the cluster could not start. It has
 * neither finished nor made progress, so it is presented as neither.
 */
export type ResultInstanceLifecycle =
  | ResultProgressReadFailure
  | { kind: "failed"; reason: string }
  | { kind: "pending" }
  | { kind: "stalled"; reason: string }
  | { kind: "succeeded" }
  | { kind: "unestablished" };

/**
 * What the instance's own phase says about it. The Data Manager documents the phases it decides an
 * instance's outcome with, so nothing is inferred from the tasks that created it: `COMPLETED` and
 * `SUCCEEDED` are the only phases that read as success, and an error the instance recorded
 * outranks them, which is the case a phase alone would report as completed work. `UNKNOWN` is the
 * Data Manager saying it cannot place the instance, and a phase this client has no rule for says
 * exactly as much.
 */
const classifyInstancePhase = (instance: ResultInstanceFacts): ResultInstanceLifecycle => {
  const failure = (): ResultInstanceLifecycle => ({
    kind: "failed",
    reason: instance.error_message ?? "This instance reported a failure.",
  });

  switch (instance.phase) {
    case "COMPLETED":
    case "SUCCEEDED":
      return instance.error_message === undefined ? { kind: "succeeded" } : failure();
    case "CRASH_LOOP_BACKOFF":
      return { kind: "stalled", reason: "This instance keeps restarting without running." };
    case "FAILED":
      return failure();
    case "IMAGE_PULL_BACKOFF":
      return {
        kind: "stalled",
        reason: "This instance's image could not be pulled, so it has not started.",
      };
    case "PENDING":
    case "RUNNING":
      return { kind: "pending" };
    default:
      return { kind: "unknown", reason: progressUnknownReason("instance") };
  }
};

/**
 * What one instance's own read says about it. An instance that has settled stays settled, so a
 * later failed refresh cannot unsettle it; one that has not settled and whose read failed is
 * reported by that failure rather than by the progress it last showed.
 */
export const resolveResultInstanceLifecycle = ({
  instance,
  instanceError,
}: {
  instance?: ResultInstanceFacts;
  instanceError?: unknown;
}): ResultInstanceLifecycle => {
  const progress = instance === undefined ? undefined : classifyInstancePhase(instance);
  if (progress?.kind === "failed" || progress?.kind === "succeeded") {
    return progress;
  }
  if (instanceError !== undefined && instanceError !== null) {
    return classifyProgressReadFailure(instanceError, "instance");
  }
  return progress ?? { kind: "unestablished" };
};

/**
 * Only an instance that is still working is polled at the pace of one that answers. An instance the
 * cluster could not start, and a read that failed transiently, are both still worth asking about
 * but not at that pace; anything settled or unusable is not asked again at all.
 */
export const resultInstancePollInterval = (lifecycle: ResultInstanceLifecycle): number | false => {
  switch (lifecycle.kind) {
    case "pending":
      return pendingPollIntervalMs;
    case "stalled":
    case "unconfirmed":
      return unconfirmedPollIntervalMs;
    case "failed":
    case "succeeded":
    case "unestablished":
    case "unknown":
      return false;
  }
};

/**
 * Whether the instance has accounted for itself. Only an instance the Data Manager finished is
 * settled; one still in the cluster is pending, whether it is running or stuck; and progress that
 * could not be read at all establishes nothing, which is a different thing from an instance known
 * to be running.
 */
export type ResultInstanceSettlement = ResultSettlement;

export const resultInstanceSettlement = (
  lifecycle: ResultInstanceLifecycle,
): ResultInstanceSettlement => {
  switch (lifecycle.kind) {
    case "failed":
    case "succeeded":
      return "settled";
    case "pending":
    case "stalled":
      return "pending";
    case "unconfirmed":
    case "unestablished":
    case "unknown":
      return "unestablished";
  }
};

/**
 * What the one request the Data Manager takes for an instance would do to this one: stop an
 * instance that is still in the cluster, or delete a result that has finished. Progress that
 * established nothing names neither, because either name would be a guess about what an
 * irreversible request would destroy.
 */
export const resultInstanceTerminationAction = (
  lifecycle: ResultInstanceLifecycle,
): "delete" | "terminate" | undefined => {
  switch (resultInstanceSettlement(lifecycle)) {
    case "pending":
      return "terminate";
    case "settled":
      return "delete";
    case "unestablished":
      return undefined;
  }
};

/** What kind of work an instance ran, where this client has a rule for the type it declares. */
export type ResultInstanceKind = "application" | "job";

export const resultInstanceKind = (
  instance: Pick<ResultInstanceFacts, "application_type">,
): ResultInstanceKind | undefined => {
  switch (instance.application_type) {
    case "APPLICATION":
      return "application";
    case "JOB":
      return "job";
    default:
      return undefined;
  }
};

/**
 * The job definition one instance ran, where this client can address it. Only a job instance names
 * one at all, and an identity the Data Manager's own Job ID format does not accept produces no
 * definition rather than a request this client invented.
 */
export const resultInstanceJob = (
  instance: Pick<ResultInstanceFacts, "application_type" | "job_id">,
): number | undefined => {
  const jobId = instance.job_id;
  if (resultInstanceKind(instance) !== "job" || jobId === undefined) {
    return undefined;
  }
  return Number.isSafeInteger(jobId) && jobId > 0 ? jobId : undefined;
};

/**
 * The directory an instance writes its own logs to. It is a path of the project that owns the
 * instance, so the logs of one instance are always addressed through that project's Files.
 */
export const resultInstanceLogsPath = (instanceId: string) => `/.${instanceId}`;
