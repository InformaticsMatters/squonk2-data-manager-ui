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

/**
 * One output an instance declared, in the form the screen presents it: the name the instance keys
 * it by, a title to show it under, and the instance-relative path it writes, addressed either as a
 * file or as a directory.
 */
export type ResultInstanceOutput = {
  creates: string;
  kind: "directory" | "file";
  name: string;
  title: string;
};

/**
 * The two fields an instance can declare its outputs in. `outputs` holds the outputs fixed when the
 * instance was launched, which is what step instances use; `rendered_outputs` is the JSON string a
 * job's own definition renders, and is the only one a job instance populates.
 */
export type ResultInstanceOutputFacts = {
  outputs?: Record<string, unknown>;
  rendered_outputs?: string;
};

/**
 * The rendered outputs an instance carries. The Data Manager hands them over as a JSON string, so a
 * string it did not render as JSON declares nothing rather than throwing on the screen that shows
 * the outputs.
 */
const parseRenderedOutputs = (rendered?: string): unknown => {
  if (rendered === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(rendered);
  } catch {
    return undefined;
  }
};

/**
 * Whether an output is addressed as a file or as a directory. The Data Manager names a single file
 * and a glob of files distinctly, and both are located as files; anything else — including an
 * output that declared no type at all — is located as the directory that contains it, because a
 * path this client cannot place as a file is not one it can open.
 */
const outputKind = (type: unknown): ResultInstanceOutput["kind"] =>
  type === "file" || type === "files" ? "file" : "directory";

/**
 * The outputs one declaration accounts for. Only an output naming a path can be located, so one
 * that names none is not presented at all rather than presented as a link to nowhere, and an
 * untitled output is shown under the name the instance keys it by.
 */
const declaredOutputs = (declared: unknown): ResultInstanceOutput[] => {
  if (typeof declared !== "object" || declared === null || Array.isArray(declared)) {
    return [];
  }

  return Object.entries(declared).flatMap(([name, output]) => {
    if (typeof output !== "object" || output === null || Array.isArray(output)) {
      return [];
    }

    const { creates, title, type } = output as Record<string, unknown>;
    if (typeof creates !== "string" || creates.trim() === "") {
      return [];
    }

    return [
      {
        creates,
        kind: outputKind(type),
        name,
        title: typeof title === "string" && title.trim() !== "" ? title : name,
      },
    ];
  });
};

/**
 * What one instance produced. A job renders its outputs into `rendered_outputs`, so that is what it
 * is accounted for by; `outputs` answers for the step instances that fix their outputs at launch,
 * and for anything a job left unrendered. The rendered field is a JSON string the Data Manager
 * owns, so a string this client cannot parse leaves the instance accounted for by the field it can
 * read rather than failing the screen the outputs are shown on.
 */
export const resultInstanceOutputs = (
  instance: ResultInstanceOutputFacts,
): ResultInstanceOutput[] => {
  const rendered = declaredOutputs(parseRenderedOutputs(instance.rendered_outputs));
  return rendered.length > 0 ? rendered : declaredOutputs(instance.outputs);
};
