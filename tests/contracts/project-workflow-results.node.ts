import { type RunningWorkflowGetResponse, type RunningWorkflowSummary } from "@/api/data-manager";
import {
  getGetRunningWorkflowQueryKey,
  getGetRunningWorkflowsQueryKey,
  getGetRunningWorkflowStepsQueryKey,
} from "@/api/data-manager/workflow";

import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  evaluateResultWorkflowLifecycleCapability,
  type ProjectCapabilityFacts,
  type ProjectResultWorkflowFacts,
} from "../../src/projects/capabilities";
import { resolveResultCapabilities } from "../../src/projects/resultCapabilities";
import { resultListRequests, runningWorkflowOwner } from "../../src/projects/resultFacts";
import { projectLinks } from "../../src/projects/routes";
import {
  resolveResultWorkflowLifecycle,
  resultWorkflowLifecycleAction,
  resultWorkflowPollInterval,
  resultWorkflowSettlement,
  resultWorkflowStepInstance,
} from "../../src/projects/workflowFacts";

const projectId = "project-33333333-3333-4333-8333-333333333333";
const otherProjectId = "project-99999999-9999-4999-8999-999999999999";
const runningWorkflowId = "r-workflow-44444444-4444-4444-4444-444444444444";
const instanceId = "instance-55555555-5555-4555-8555-555555555555";
const editor = "editor@example.org";
const observer = "observer@example.org";

const workflow = (overrides: Partial<RunningWorkflowGetResponse> = {}) =>
  ({
    error_num: 0,
    id: runningWorkflowId,
    name: "Acceptance Workflow",
    project: { id: projectId, name: "Acceptance Project" },
    started: "2026-01-02T04:04:05Z",
    status: "SUCCESS",
    stopped: "2026-01-02T04:14:05Z",
    workflow: { id: "workflow-66666666-6666-4666-8666-666666666666" },
    ...overrides,
  }) as RunningWorkflowGetResponse;

const transient = new Response(null, { status: 503 });

test("a workflow the Data Manager still reports as running is worth asking about again", () => {
  const lifecycle = resolveResultWorkflowLifecycle({
    workflow: workflow({ status: "RUNNING", stopped: undefined }),
  });

  expect(lifecycle).toEqual({ kind: "pending" });
  expect(resultWorkflowPollInterval(lifecycle)).toBe(5000);
  // Nothing is known about a workflow whose own read has not answered yet, and an unanswered read
  // is not a poll: the request already in flight is what settles it.
  expect(resolveResultWorkflowLifecycle({})).toEqual({ kind: "unestablished" });
  expect(resultWorkflowPollInterval({ kind: "unestablished" })).toBe(false);
});

test("only a workflow the Data Manager finished successfully reads as success", () => {
  expect(resolveResultWorkflowLifecycle({ workflow: workflow() })).toEqual({ kind: "succeeded" });
  expect(resultWorkflowPollInterval({ kind: "succeeded" })).toBe(false);

  // A failed workflow is reported in the words the Data Manager gave for the failure.
  expect(
    resolveResultWorkflowLifecycle({
      workflow: workflow({
        error_msg: "Step 2 could not be scheduled.",
        error_num: 7,
        status: "FAILURE",
      }),
    }),
  ).toEqual({ kind: "failed", reason: "Step 2 could not be scheduled." });
  expect(
    resolveResultWorkflowLifecycle({ workflow: workflow({ error_num: 7, status: "FAILURE" }) }),
  ).toEqual({ kind: "failed", reason: "This workflow reported a failure." });

  // An error the workflow recorded outranks a status that would otherwise have read as success,
  // which is the case a status alone would report as a completed run.
  expect(
    resolveResultWorkflowLifecycle({
      workflow: workflow({ error_msg: "Step 3 produced no output.", error_num: 2 }),
    }),
  ).toEqual({ kind: "failed", reason: "Step 3 produced no output." });

  // A workflow a caller stopped neither succeeded nor failed, and is not reported as either.
  expect(
    resolveResultWorkflowLifecycle({ workflow: workflow({ status: "USER_STOPPED" }) }),
  ).toEqual({ kind: "stopped", reason: "This workflow was stopped before it finished." });
  expect(resultWorkflowPollInterval({ kind: "stopped", reason: "any" })).toBe(false);
});

test("a progress read that failed transiently backs off; one that cannot be read stops", () => {
  const unconfirmed = resolveResultWorkflowLifecycle({ workflowError: transient });
  expect(unconfirmed).toEqual({
    kind: "unconfirmed",
    reason: "This workflow's progress could not be read. It is still being checked.",
  });
  // A transient failure keeps checking, but not at the pace of a workflow that is answering.
  expect(resultWorkflowPollInterval(unconfirmed)).toBe(15_000);
  expect(resultWorkflowPollInterval(unconfirmed)).toBeGreaterThan(
    resultWorkflowPollInterval({ kind: "pending" }) as number,
  );

  // A refusal, an absence, or anything this client cannot interpret stops the poll rather than
  // asking forever, and is never reported as a finished workflow.
  for (const workflowError of [
    new Response(null, { status: 403 }),
    new Response(null, { status: 404 }),
    new Error("no status"),
  ]) {
    const unknown = resolveResultWorkflowLifecycle({ workflowError });
    expect(unknown).toEqual({
      kind: "unknown",
      reason: "This workflow's progress could not be established. Retry to check it again.",
    });
    expect(resultWorkflowPollInterval(unknown)).toBe(false);
  }

  // A status this client has no rule for is not a running workflow and not a finished one, so it
  // stops asking instead of guessing which.
  expect(
    resolveResultWorkflowLifecycle({
      workflow: workflow({ status: "PAUSED" as RunningWorkflowGetResponse["status"] }),
    }),
  ).toEqual({
    kind: "unknown",
    reason: "This workflow's progress could not be established. Retry to check it again.",
  });

  // A workflow that already settled stays settled, so a later failed refresh cannot unsettle it;
  // one still running whose refresh failed is reported by that failure rather than as finished.
  expect(
    resolveResultWorkflowLifecycle({ workflow: workflow(), workflowError: transient }),
  ).toEqual({ kind: "succeeded" });
  expect(
    resolveResultWorkflowLifecycle({
      workflow: workflow({ status: "RUNNING", stopped: undefined }),
      workflowError: transient,
    }),
  ).toEqual({
    kind: "unconfirmed",
    reason: "This workflow's progress could not be read. It is still being checked.",
  });
});

test("what the retained control does is decided by the workflow's own progress", () => {
  // The Data Manager stops a workflow that is still running and deletes one that has finished, so
  // the control offers whichever of the two the concrete workflow can actually answer.
  expect(resultWorkflowLifecycleAction({ kind: "pending" })).toBe("stop");
  for (const lifecycle of [
    { kind: "succeeded" },
    { kind: "failed", reason: "any" },
    { kind: "stopped", reason: "any" },
  ] as const) {
    expect(resultWorkflowLifecycleAction(lifecycle)).toBe("delete");
  }
  // Progress that established nothing offers neither, because either request would be a guess.
  for (const lifecycle of [
    { kind: "unconfirmed", reason: "any" },
    { kind: "unestablished" },
    { kind: "unknown", reason: "any" },
  ] as const) {
    expect(resultWorkflowLifecycleAction(lifecycle)).toBeUndefined();
    expect(resultWorkflowSettlement(lifecycle)).toBe("unestablished");
  }
  expect(resultWorkflowSettlement({ kind: "pending" })).toBe("pending");
  expect(resultWorkflowSettlement({ kind: "succeeded" })).toBe("settled");

  // A summary the project's own collection returned settles a workflow by exactly the same rule,
  // so a listed workflow and the addressed one never disagree about what may be done to it.
  const summary = { error_num: 0, status: "RUNNING" } as RunningWorkflowSummary;
  expect(resolveResultWorkflowLifecycle({ workflow: summary })).toEqual({ kind: "pending" });
  expect(resolveResultWorkflowLifecycle({ workflow: { ...summary, status: "SUCCESS" } })).toEqual({
    kind: "succeeded",
  });
});

const project = (): ProjectCapabilityFacts["project"] => ({
  administrators: [],
  creator: editor,
  editors: [editor],
  observers: [observer],
});

const workflowFacts = (
  overrides: Partial<ProjectResultWorkflowFacts> & { username?: string } = {},
): ProjectResultWorkflowFacts => {
  const { username = editor, ...rest } = overrides;
  return {
    caller: { isPlatformAdministrator: false, username },
    owningProjectId: projectId,
    project: project(),
    routeProjectId: projectId,
    settlement: "settled",
    subscription: { accountsForInstances: true, atLimit: false },
    ...rest,
  };
};

test("stopping or deleting a workflow answers to the concrete workflow and its project", () => {
  expect(evaluateResultWorkflowLifecycleCapability(workflowFacts())).toEqual({ status: "enabled" });
  // A workflow still running is stopped rather than deleted, so it stays actionable.
  expect(
    evaluateResultWorkflowLifecycleCapability(workflowFacts({ settlement: "pending" })),
  ).toEqual({ status: "enabled" });

  // A workflow whose progress established nothing offers neither request, because this client
  // cannot tell which of the two the Data Manager would accept.
  expect(
    evaluateResultWorkflowLifecycleCapability(workflowFacts({ settlement: "unestablished" })),
  ).toEqual({
    status: "disabled",
    reason:
      "This workflow's progress could not be established, so stopping or deleting it cannot be established as safe.",
  });

  // Project facts still decide first: authority and ownership are more useful explanations than
  // the workflow's own progress, and neither is overridden by it.
  expect(
    evaluateResultWorkflowLifecycleCapability(
      workflowFacts({ settlement: "unestablished", username: observer }),
    ),
  ).toEqual({
    status: "disabled",
    reason:
      "You must be a project editor or administrator to stop or delete workflows in this project.",
  });
  expect(
    evaluateResultWorkflowLifecycleCapability(
      workflowFacts({ owningProjectId: otherProjectId, settlement: "unestablished" }),
    ),
  ).toEqual({
    status: "disabled",
    reason: "This result belongs to another project, so it cannot be changed from this project.",
  });
  // Content a failed refresh left on screen cannot establish that changing it is safe either.
  expect(evaluateResultWorkflowLifecycleCapability(workflowFacts({ content: "stale" }))).toEqual({
    status: "disabled",
    reason: "This result could not be refreshed, so changing it cannot be established as safe.",
  });
});

test("the workflow a caller is looking at is what decides its own lifecycle control", () => {
  const facts = {
    caller: { isPlatformAdministrator: false, username: editor },
    freshness: "current",
    project: project(),
    subscription: { accountsForInstances: true, atLimit: false },
  } as Parameters<typeof resolveResultCapabilities>[0];
  const capabilities = (workflowSettlement?: "pending" | "settled" | "unestablished") =>
    resolveResultCapabilities(facts, {
      owningProjectId: projectId,
      routeProjectId: projectId,
      workflowSettlement,
    });

  expect(capabilities("settled").workflowLifecycle).toEqual({ status: "enabled" });
  expect(capabilities("unestablished").workflowLifecycle).toEqual({
    status: "disabled",
    reason:
      "This workflow's progress could not be established, so stopping or deleting it cannot be established as safe.",
  });
  // A workflow's own progress is a fact about that workflow alone: it withholds nothing from the
  // tasks and instances displayed beside it.
  expect(capabilities("unestablished").termination).toEqual({ status: "enabled" });
  expect(capabilities("unestablished").taskDeletion).toEqual({ status: "enabled" });
  // A result with no workflow to account for is unchanged by the rule.
  expect(capabilities().workflowLifecycle).toEqual({ status: "enabled" });
});

test("a step is addressed in the project that owns the workflow that ran it", () => {
  expect(resultWorkflowStepInstance({ instance_id: instanceId })).toBe(instanceId);
  expect(projectLinks.result(projectId, "instances", instanceId)).toBe(
    `/projects/${projectId}/results/instances/${instanceId}`,
  );
  // A step this client cannot address produces no link at all rather than one it invented, and a
  // running workflow always declares the project its steps ran in.
  expect(resultWorkflowStepInstance({})).toBeUndefined();
  expect(resultWorkflowStepInstance({ instance_id: "not-an-instance" })).toBeUndefined();
  expect(runningWorkflowOwner(workflow())).toBe(projectId);
  expect(runningWorkflowOwner(workflow({ project: {} }))).toBeUndefined();
});

test("an addressed workflow is cached and refreshed under its project's own collection", () => {
  // The generated key factories are the only cache identity of the addressed workflow and of its
  // steps, and the collection key is always built from a project-constrained list request.
  expect(getGetRunningWorkflowQueryKey(runningWorkflowId)).not.toEqual(
    getGetRunningWorkflowQueryKey("r-workflow-other"),
  );
  expect(getGetRunningWorkflowStepsQueryKey(runningWorkflowId)).not.toEqual(
    getGetRunningWorkflowQueryKey(runningWorkflowId),
  );
  expect(getGetRunningWorkflowsQueryKey(resultListRequests(projectId).workflows)).not.toEqual(
    getGetRunningWorkflowsQueryKey(resultListRequests(otherProjectId).workflows),
  );
});

test("one module owns the addressed workflow read, its polling, and the commands that follow it", () => {
  const root = path.join(process.cwd(), "src");

  // The hook that polled a workflow without a project is gone: a workflow is only read beneath the
  // project it declares as its own.
  expect(existsSync(path.join(root, "hooks/usePolledGetWorkflow.ts"))).toBe(false);

  // The list of statuses that used to decide, on its own, whether a workflow had finished is gone
  // too, so nothing can disagree with the one place a workflow's own progress is read.
  expect(readFileSync(path.join(root, "constants/results.ts"), "utf8")).not.toContain(
    "WORKFLOW_DONE_PHASES",
  );

  const typescriptSource = /\.tsx?$/u;
  const generated = /(?:^|\/)generated\//u;
  const readsAddressedWorkflow = /\buseGetRunningWorkflow\b|\buseGetRunningWorkflowSteps\b/u;
  const readsWorkflowDirectly = readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    )
    .filter((file) => !generated.test(file))
    .filter((file) => readsAddressedWorkflow.test(readFileSync(path.join(root, file), "utf8")))
    .toSorted();

  // Results reads one addressed workflow in one place, so its polling rule cannot be decided twice.
  expect(readsWorkflowDirectly).toEqual(["projects/useResultWorkflow.ts"]);

  // That one place is told which project the workflow is addressed beneath, and nothing past a
  // workflow that disowns it is read: its steps are not requested and its poll stops.
  const read = readFileSync(path.join(root, "projects/useResultWorkflow.ts"), "utf8");
  expect(read).toContain("projectId: string");
  expect(read).toMatch(/enabled: owned/u);

  // The workflow's stop and delete stay with the one owner of Results mutations and their
  // invalidation.
  const lifecycleButton = readFileSync(
    path.join(root, "components/workflows/WorkflowLifecycleButton.tsx"),
    "utf8",
  );
  expect(lifecycleButton).toContain("useResultCommands");
  expect(lifecycleButton).not.toMatch(
    /useQueryClient|invalidateQueries|useDeleteRunningWorkflow|useStopRunningWorkflow/u,
  );
});
