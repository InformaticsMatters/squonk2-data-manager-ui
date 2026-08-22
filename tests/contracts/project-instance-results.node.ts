import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";
import { getGetInstanceQueryKey, getGetInstancesQueryKey } from "@/api/data-manager/instance";

import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  evaluateResultArchiveCapability,
  evaluateResultTerminationCapability,
  type ProjectCapabilityFacts,
  type ProjectResultInstanceFacts,
} from "../../src/projects/capabilities";
import {
  resolveResultInstanceLifecycle,
  resultInstanceJob,
  resultInstanceKind,
  resultInstanceLogsPath,
  resultInstancePollInterval,
  resultInstanceSettlement,
  resultInstanceTerminationAction,
} from "../../src/projects/instanceFacts";
import { resolveResultCapabilities } from "../../src/projects/resultCapabilities";
import { instanceOwner, resultListRequests } from "../../src/projects/resultFacts";
import { projectLinks } from "../../src/projects/routes";

const projectId = "project-33333333-3333-4333-8333-333333333333";
const otherProjectId = "project-99999999-9999-4999-8999-999999999999";
const instanceId = "instance-55555555-5555-4555-8555-555555555555";
const editor = "editor@example.org";
const observer = "observer@example.org";

const instance = (overrides: Partial<InstanceGetResponse> = {}) =>
  ({
    application_id: "acceptance-application",
    application_type: "JOB",
    application_version: "1.0.0",
    archived: false,
    job_id: 1,
    job_name: "Acceptance Job",
    launched: "2026-01-02T03:04:05Z",
    name: "Acceptance Instance",
    phase: "COMPLETED",
    project_id: projectId,
    started: "2026-01-02T03:04:05Z",
    stopped: "2026-01-02T03:05:05Z",
    ...overrides,
  }) as InstanceGetResponse;

const transient = new Response(null, { status: 503 });

test("an instance the Data Manager still reports as working is worth asking about again", () => {
  for (const phase of ["PENDING", "RUNNING"] as const) {
    const lifecycle = resolveResultInstanceLifecycle({
      instance: instance({ phase, stopped: undefined }),
    });
    expect(lifecycle).toEqual({ kind: "pending" });
    expect(resultInstancePollInterval(lifecycle)).toBe(5000);
  }

  // Nothing is known about an instance whose own read has not answered yet, and an unanswered read
  // is not a poll: the request already in flight is what settles it.
  expect(resolveResultInstanceLifecycle({})).toEqual({ kind: "unestablished" });
  expect(resultInstancePollInterval({ kind: "unestablished" })).toBe(false);
});

test("only an instance the Data Manager finished cleanly reads as success", () => {
  for (const phase of ["COMPLETED", "SUCCEEDED"] as const) {
    expect(resolveResultInstanceLifecycle({ instance: instance({ phase }) })).toEqual({
      kind: "succeeded",
    });
  }
  expect(resultInstancePollInterval({ kind: "succeeded" })).toBe(false);

  // A failed instance is reported in the words the Data Manager gave for the failure.
  expect(
    resolveResultInstanceLifecycle({
      instance: instance({ error_message: "The job image exited with code 4.", phase: "FAILED" }),
    }),
  ).toEqual({ kind: "failed", reason: "The job image exited with code 4." });
  expect(resolveResultInstanceLifecycle({ instance: instance({ phase: "FAILED" }) })).toEqual({
    kind: "failed",
    reason: "This instance reported a failure.",
  });

  // An error the instance recorded outranks a phase that would otherwise have read as success,
  // which is the case a phase alone would report as completed work.
  expect(
    resolveResultInstanceLifecycle({
      instance: instance({ error_message: "The outputs could not be written." }),
    }),
  ).toEqual({ kind: "failed", reason: "The outputs could not be written." });
});

test("an instance that is not progressing is neither running nor finished", () => {
  // The Data Manager reports these phases for an instance the cluster could not start. It has not
  // finished, so it is never reported as an outcome, and it is asked about less often than one
  // that is actually running.
  for (const [phase, reason] of [
    ["CRASH_LOOP_BACKOFF", "This instance keeps restarting without running."],
    ["IMAGE_PULL_BACKOFF", "This instance's image could not be pulled, so it has not started."],
  ] as const) {
    const lifecycle = resolveResultInstanceLifecycle({
      instance: instance({ phase, stopped: undefined }),
    });
    expect(lifecycle).toEqual({ kind: "stalled", reason });
    expect(resultInstancePollInterval(lifecycle)).toBe(15_000);
    // It still exists in the cluster, so the request the Data Manager takes for it is a stop.
    expect(resultInstanceSettlement(lifecycle)).toBe("pending");
    expect(resultInstanceTerminationAction(lifecycle)).toBe("terminate");
  }
});

test("a progress read that failed transiently backs off; one that cannot be read stops", () => {
  const unconfirmed = resolveResultInstanceLifecycle({ instanceError: transient });
  expect(unconfirmed).toEqual({
    kind: "unconfirmed",
    reason: "This instance's progress could not be read. It is still being checked.",
  });
  // A transient failure keeps checking, but not at the pace of an instance that is answering.
  expect(resultInstancePollInterval(unconfirmed)).toBe(15_000);
  expect(resultInstancePollInterval(unconfirmed)).toBeGreaterThan(
    resultInstancePollInterval({ kind: "pending" }) as number,
  );

  // A refusal, an absence, or anything this client cannot interpret stops the poll rather than
  // asking forever, and is never reported as a finished instance.
  for (const instanceError of [
    new Response(null, { status: 403 }),
    new Response(null, { status: 404 }),
    new Error("no status"),
  ]) {
    const unknown = resolveResultInstanceLifecycle({ instanceError });
    expect(unknown).toEqual({
      kind: "unknown",
      reason: "This instance's progress could not be established. Retry to check it again.",
    });
    expect(resultInstancePollInterval(unknown)).toBe(false);
  }

  // The Data Manager's own `UNKNOWN` phase says exactly as much as a read this client cannot
  // interpret, and a phase it has no rule for says no more than either.
  for (const phase of ["UNKNOWN", "SUSPENDED" as InstanceGetResponse["phase"]] as const) {
    expect(resolveResultInstanceLifecycle({ instance: instance({ phase }) })).toEqual({
      kind: "unknown",
      reason: "This instance's progress could not be established. Retry to check it again.",
    });
  }

  // An instance that already settled stays settled, so a later failed refresh cannot unsettle it;
  // one still running whose refresh failed is reported by that failure rather than as finished.
  expect(
    resolveResultInstanceLifecycle({ instance: instance(), instanceError: transient }),
  ).toEqual({ kind: "succeeded" });
  expect(
    resolveResultInstanceLifecycle({
      instance: instance({ phase: "RUNNING", stopped: undefined }),
      instanceError: transient,
    }),
  ).toEqual({
    kind: "unconfirmed",
    reason: "This instance's progress could not be read. It is still being checked.",
  });
});

test("what the retained control does is decided by the instance's own progress", () => {
  // The Data Manager takes one request for an instance, but what it does to a running instance and
  // to a finished one are different things, so the control names whichever the instance calls for.
  expect(resultInstanceTerminationAction({ kind: "pending" })).toBe("terminate");
  for (const lifecycle of [{ kind: "succeeded" }, { kind: "failed", reason: "any" }] as const) {
    expect(resultInstanceTerminationAction(lifecycle)).toBe("delete");
    expect(resultInstanceSettlement(lifecycle)).toBe("settled");
  }
  // Progress that established nothing offers neither, because either name would be a guess about
  // what an irreversible request would destroy.
  for (const lifecycle of [
    { kind: "unconfirmed", reason: "any" },
    { kind: "unestablished" },
    { kind: "unknown", reason: "any" },
  ] as const) {
    expect(resultInstanceTerminationAction(lifecycle)).toBeUndefined();
    expect(resultInstanceSettlement(lifecycle)).toBe("unestablished");
  }

  // A summary the project's own collection returned settles an instance by exactly the same rule,
  // so a listed instance and the addressed one never disagree about what may be done to it.
  const summary = { phase: "RUNNING" } as InstanceSummary;
  expect(resolveResultInstanceLifecycle({ instance: summary })).toEqual({ kind: "pending" });
  expect(resolveResultInstanceLifecycle({ instance: { ...summary, phase: "COMPLETED" } })).toEqual({
    kind: "succeeded",
  });
});

test("what an instance is, and what it can be addressed by, comes from the instance itself", () => {
  expect(resultInstanceKind(instance())).toBe("job");
  expect(resultInstanceKind(instance({ application_type: "APPLICATION" }))).toBe("application");
  // A type this client has no rule for is not presented as either kind.
  expect(
    resultInstanceKind(
      instance({ application_type: "OTHER" as InstanceGetResponse["application_type"] }),
    ),
  ).toBeUndefined();

  // A job instance names the definition it ran, and one whose definition this client cannot
  // address produces no link at all rather than one it invented.
  expect(resultInstanceJob(instance())).toBe(1);
  expect(resultInstanceJob(instance({ job_id: undefined }))).toBeUndefined();
  expect(resultInstanceJob(instance({ job_id: 0 }))).toBeUndefined();
  expect(resultInstanceJob(instance({ job_id: 1.5 }))).toBeUndefined();
  expect(resultInstanceJob(instance({ application_type: "APPLICATION" }))).toBeUndefined();

  // An instance's logs are files of the project that owns it, at the directory it names itself.
  expect(projectLinks.files(projectId, { path: resultInstanceLogsPath(instanceId) })).toBe(
    `/projects/${projectId}/files?path=%2F.${instanceId}`,
  );
  expect(projectLinks.result(projectId, "instances", instanceId)).toBe(
    `/projects/${projectId}/results/instances/${instanceId}`,
  );

  // An instance always declares the project it belongs to, which is what places it.
  expect(instanceOwner(instance())).toBe(projectId);
  expect(instanceOwner({ project_id: "" })).toBeUndefined();
});

const project = (): ProjectCapabilityFacts["project"] => ({
  administrators: [],
  creator: editor,
  editors: [editor],
  observers: [observer],
});

const instanceFacts = (
  overrides: Partial<ProjectResultInstanceFacts> & { username?: string } = {},
): ProjectResultInstanceFacts => {
  const { username = editor, ...rest } = overrides;
  return {
    caller: { username },
    owningProjectId: projectId,
    project: project(),
    routeProjectId: projectId,
    settlement: "settled",
    subscription: { accountsForInstances: true, atLimit: false },
    ...rest,
  };
};

test("stopping or deleting an instance answers to the concrete instance and its project", () => {
  expect(evaluateResultTerminationCapability(instanceFacts())).toEqual({ status: "enabled" });
  // An instance still running is stopped rather than deleted, so it stays actionable.
  expect(evaluateResultTerminationCapability(instanceFacts({ settlement: "pending" }))).toEqual({
    status: "enabled",
  });

  // An instance whose progress established nothing withholds the request, because this client
  // cannot say whether it would stop running work or destroy a finished result.
  expect(
    evaluateResultTerminationCapability(instanceFacts({ settlement: "unestablished" })),
  ).toEqual({
    status: "disabled",
    reason:
      "This instance's progress could not be established, so stopping or deleting it cannot be established as safe.",
  });

  // Project facts still decide first: authority and ownership are more useful explanations than
  // the instance's own progress, and neither is overridden by it.
  expect(
    evaluateResultTerminationCapability(
      instanceFacts({ settlement: "unestablished", username: observer }),
    ),
  ).toEqual({
    status: "disabled",
    reason:
      "You must be a project editor or administrator to stop or delete instances in this project.",
  });
  expect(
    evaluateResultTerminationCapability(
      instanceFacts({ owningProjectId: otherProjectId, settlement: "unestablished" }),
    ),
  ).toEqual({
    status: "disabled",
    reason: "This result belongs to another project, so it cannot be changed from this project.",
  });
  // Content a failed refresh left on screen cannot establish that changing it is safe either.
  expect(evaluateResultTerminationCapability(instanceFacts({ content: "stale" }))).toEqual({
    status: "disabled",
    reason: "This result could not be refreshed, so changing it cannot be established as safe.",
  });

  // Archiving only protects an instance from automatic deletion and is reversible, so it depends
  // on the project alone rather than on what the instance's progress could establish.
  expect(evaluateResultArchiveCapability(instanceFacts({ settlement: "unestablished" }))).toEqual({
    status: "enabled",
  });
});

test("the instance a caller is looking at is what decides its own retained controls", () => {
  const facts = {
    caller: { username: editor },
    freshness: "current",
    project: project(),
    subscription: { accountsForInstances: true, atLimit: false },
  } as Parameters<typeof resolveResultCapabilities>[0];
  const capabilities = (instanceSettlement?: "pending" | "settled" | "unestablished") =>
    resolveResultCapabilities(facts, {
      instanceSettlement,
      owningProjectId: projectId,
      routeProjectId: projectId,
    });

  expect(capabilities("settled").termination).toEqual({ status: "enabled" });
  expect(capabilities("unestablished").termination).toEqual({
    status: "disabled",
    reason:
      "This instance's progress could not be established, so stopping or deleting it cannot be established as safe.",
  });
  // An instance's own progress is a fact about that instance alone: it withholds nothing from the
  // tasks and workflows displayed beside it, and nothing from archiving or rerunning it.
  expect(capabilities("unestablished").taskDeletion).toEqual({ status: "enabled" });
  expect(capabilities("unestablished").workflowLifecycle).toEqual({ status: "enabled" });
  expect(capabilities("unestablished").archive).toEqual({ status: "enabled" });
  expect(capabilities("unestablished").rerun).toEqual({ status: "enabled" });
  // A result with no instance to account for is unchanged by the rule.
  expect(capabilities().termination).toEqual({ status: "enabled" });
});

test("an addressed instance is cached and refreshed under its project's own collection", () => {
  // The generated key factories are the only cache identity of the addressed instance, and the
  // collection key is always built from a project-constrained list request.
  expect(getGetInstanceQueryKey(instanceId)).not.toEqual(getGetInstanceQueryKey("instance-other"));
  expect(getGetInstancesQueryKey(resultListRequests(projectId).instances)).not.toEqual(
    getGetInstancesQueryKey(resultListRequests(otherProjectId).instances),
  );
});

test("one module owns the addressed instance read and the polling that follows it", () => {
  const root = path.join(process.cwd(), "src");

  // The hook that polled an instance without a project is gone, along with the list of phases that
  // used to decide on its own whether an instance had finished, so nothing can disagree with the
  // one place an instance's own progress is read.
  expect(existsSync(path.join(root, "hooks/usePolledGetInstance.ts"))).toBe(false);
  expect(existsSync(path.join(root, "constants/results.ts"))).toBe(false);

  const typescriptSource = /\.tsx?$/u;
  const generated = /(?:^|\/)generated\//u;
  const readsAddressedInstance = /\buseGetInstance\b/u;
  const readsInstanceDirectly = readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    )
    .filter((file) => !generated.test(file))
    .filter((file) => readsAddressedInstance.test(readFileSync(path.join(root, file), "utf8")))
    .toSorted();

  // Results reads one addressed instance in one place, so its polling rule cannot be decided twice
  // and a card cannot fetch the instance a second time under a cadence of its own.
  expect(readsInstanceDirectly).toEqual(["projects/useResultInstance.ts"]);

  // That one place is told which project the instance is addressed beneath, and an instance that
  // disowns it is not polled.
  const read = readFileSync(path.join(root, "projects/useResultInstance.ts"), "utf8");
  expect(read).toContain("projectId: string");

  // The instance's stop, delete, and archive stay with the one owner of Results mutations and
  // their invalidation.
  for (const control of ["TerminateInstance", "ArchiveInstance"]) {
    const source = readFileSync(path.join(root, `components/instances/${control}.tsx`), "utf8");
    expect(source).toContain("useResultCommands");
    expect(source).not.toMatch(
      /useQueryClient|invalidateQueries|usePatchInstance|useTerminateInstance/u,
    );
  }
});
