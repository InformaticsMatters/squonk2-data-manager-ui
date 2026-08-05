import {
  type InstanceSummary,
  type ProjectDetail,
  type RunningWorkflowSummary,
  type TaskSummary,
} from "@/api/data-manager";
import { getGetInstancesQueryKey } from "@/api/data-manager/instance";
import { getGetTasksQueryKey } from "@/api/data-manager/task";
import { getGetRunningWorkflowsQueryKey } from "@/api/data-manager/workflow";

import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  evaluateResultArchiveCapability,
  evaluateResultRerunCapability,
  evaluateResultTaskDeletionCapability,
  evaluateResultTerminationCapability,
  evaluateResultWorkflowLifecycleCapability,
  type ProjectCapabilityFacts,
  type ProjectResultFacts,
} from "../../src/projects/capabilities";
import { resolveResultCapabilities } from "../../src/projects/resultCapabilities";
import {
  filterResultItems,
  resolveResultReadState,
  resolveResultsFreshness,
  resolveResultsReadState,
  resultListRequests,
  selectProjectResults,
} from "../../src/projects/resultFacts";
import { parseProjectRoute, projectLinks } from "../../src/projects/routes";

const projectId = "project-33333333-3333-4333-8333-333333333333";
const otherProjectId = "project-99999999-9999-4999-8999-999999999999";
const editor = "editor@example.org";
const observer = "observer@example.org";

const instance = (overrides: Partial<InstanceSummary> = {}) =>
  ({
    application_type: "JOB",
    id: "instance-11111111-1111-4111-8111-111111111111",
    job_name: "Acceptance Job",
    launched: "2026-01-02T03:00:00Z",
    name: "Job run",
    phase: "COMPLETED",
    project_id: projectId,
    ...overrides,
  }) as InstanceSummary;

const task = (overrides: Partial<TaskSummary> = {}) =>
  ({
    created: "2026-01-02T02:00:00Z",
    done: true,
    id: "task-44444444-4444-4444-4444-444444444444",
    processing_stage: "DONE",
    purpose: "DATASET",
    purpose_id: "dataset-11111111-1111-1111-1111-111111111111",
    ...overrides,
  }) as TaskSummary;

const workflow = (overrides: Partial<RunningWorkflowSummary> = {}) =>
  ({
    id: "r-workflow-22222222-2222-4222-8222-222222222222",
    name: "Acceptance Workflow",
    project: { id: projectId, name: "Acceptance Project" },
    started: "2026-01-02T04:00:00Z",
    status: "RUNNING",
    workflow: { id: "workflow-55555555-5555-4555-8555-555555555555" },
    ...overrides,
  }) as RunningWorkflowSummary;

const results = (input: Partial<Parameters<typeof selectProjectResults>[0]> = {}) =>
  selectProjectResults({
    instances: [instance()],
    projectId,
    tasks: [task()],
    workflows: [workflow()],
    ...input,
  });

test("every Results read names the project in the URL and caches under it", () => {
  const requests = resultListRequests(projectId);

  expect(requests).toEqual({
    instances: { project_id: projectId },
    tasks: { exclude_purpose: "INSTANCE.PROJECT", project_id: projectId },
    workflows: { project_id: projectId },
  });
  // The generated key factories are the only cache identity, and each key carries the project, so
  // two projects can never share a Results cache entry.
  expect(getGetInstancesQueryKey(requests.instances)).not.toEqual(
    getGetInstancesQueryKey(resultListRequests(otherProjectId).instances),
  );
  expect(getGetTasksQueryKey(requests.tasks)).not.toEqual(
    getGetTasksQueryKey(resultListRequests(otherProjectId).tasks),
  );
  expect(getGetRunningWorkflowsQueryKey(requests.workflows)).not.toEqual(
    getGetRunningWorkflowsQueryKey(resultListRequests(otherProjectId).workflows),
  );
  // No Results read is ever issued without a project argument.
  for (const request of Object.values(requests)) {
    expect(request.project_id).toBe(projectId);
  }
});

test("results are ordered most recent first and carry their own owning project", () => {
  expect(results().map(({ kind, id, owningProjectId }) => ({ kind, id, owningProjectId }))).toEqual(
    [
      { kind: "workflow", id: workflow().id, owningProjectId: projectId },
      { kind: "instance", id: instance().id, owningProjectId: projectId },
      { kind: "task", id: task().id, owningProjectId: projectId },
    ],
  );
});

test("a result naming another project is dropped rather than displayed", () => {
  const items = results({
    instances: [instance(), instance({ id: "instance-foreign", project_id: otherProjectId })],
    workflows: [
      workflow(),
      workflow({ id: "r-workflow-foreign", project: { id: otherProjectId, name: "Partner" } }),
    ],
  });

  expect(items.map(({ id }) => id)).toEqual([workflow().id, instance().id, task().id]);
  expect(items.every(({ owningProjectId }) => owningProjectId === projectId)).toBe(true);
});

test("a result declaring no project of its own belongs to the constrained request", () => {
  const items = results({ instances: [], tasks: [task()], workflows: [workflow({ project: {} })] });

  expect(items.map(({ kind, owningProjectId }) => ({ kind, owningProjectId }))).toEqual([
    { kind: "workflow", owningProjectId: projectId },
    { kind: "task", owningProjectId: projectId },
  ]);
});

test("route filter state selects types and searches result content", () => {
  const owned = results();
  const kinds = (state: Parameters<typeof filterResultItems>[1]) =>
    filterResultItems(owned, state).map(({ kind }) => kind);

  expect(kinds({ types: ["task"] })).toEqual(["task"]);
  expect(kinds({ types: ["instance", "workflow"] })).toEqual(["workflow", "instance"]);
  expect(kinds({ search: "acceptance job" })).toEqual(["instance"]);
  expect(kinds({ search: "acceptance workflow" })).toEqual(["workflow"]);
  expect(filterResultItems(owned, { search: "nothing matches this" })).toEqual([]);
  // Omitted state is every result the project owns, so no default narrows the section silently.
  expect(filterResultItems(owned)).toHaveLength(3);
  // Instance housekeeping tasks are not results a project user asked for.
  expect(results({ instances: [], workflows: [], tasks: [task({ purpose: "INSTANCE" })] })).toEqual(
    [],
  );
});

test("confirmed absence or refusal clears content while everything else retries", () => {
  expect(resolveResultsReadState([null, undefined])).toEqual({ kind: "available" });
  expect(resolveResultsReadState([new Response(null, { status: 403 })])).toEqual({
    kind: "unavailable",
  });
  expect(resolveResultsReadState([new Response(null, { status: 404 })])).toEqual({
    kind: "unavailable",
  });
  for (const status of [429, 500, 503]) {
    expect(resolveResultsReadState([new Response(null, { status })])).toEqual({
      kind: "recoverable",
      retryable: true,
    });
  }
  // An unusable transport fact is never reported as success.
  expect(resolveResultsReadState([new Error("no status")])).toEqual({
    kind: "recoverable",
    retryable: true,
  });
  // One confirmed loss outranks a transient failure on another read.
  expect(
    resolveResultsReadState([
      new Response(null, { status: 503 }),
      new Response(null, { status: 403 }),
    ]),
  ).toEqual({ kind: "unavailable" });

  expect(resolveResultsFreshness({ kind: "available" })).toBe("current");
  expect(resolveResultsFreshness({ kind: "recoverable", retryable: true })).toBe("stale");
  expect(resolveResultsFreshness({ kind: "unavailable" })).toBe("current");
});

const project = (overrides: Partial<ProjectDetail> = {}) =>
  ({
    administrators: [],
    creator: editor,
    editors: [editor],
    observers: [observer],
    ...overrides,
  }) as ProjectCapabilityFacts["project"];

const resultFacts = (
  overrides: Partial<ProjectResultFacts> & { username?: string } = {},
): ProjectResultFacts => {
  const { username = editor, ...rest } = overrides;
  return {
    caller: { isPlatformAdministrator: false, username },
    owningProjectId: projectId,
    project: project(),
    routeProjectId: projectId,
    subscription: { accountsForInstances: true, atLimit: false },
    ...rest,
  };
};

const resultCapabilities = [
  evaluateResultTerminationCapability,
  evaluateResultArchiveCapability,
  evaluateResultTaskDeletionCapability,
  evaluateResultWorkflowLifecycleCapability,
  evaluateResultRerunCapability,
];

test("a project editor may act on the results their project owns", () => {
  for (const evaluate of resultCapabilities) {
    expect(evaluate(resultFacts())).toEqual({ status: "enabled" });
  }
});

test("a result owned by another project is never actionable, whatever the caller holds", () => {
  const foreign = resultFacts({ owningProjectId: otherProjectId });
  for (const evaluate of resultCapabilities) {
    expect(evaluate(foreign)).toEqual({
      status: "disabled",
      reason: "This result belongs to another project, so it cannot be changed from this project.",
    });
  }
  // Ownership decides before the caller's authority does, so an administrator is refused too.
  expect(
    evaluateResultTerminationCapability({
      ...foreign,
      project: project({ administrators: [editor] }),
    }),
  ).toEqual({
    status: "disabled",
    reason: "This result belongs to another project, so it cannot be changed from this project.",
  });
});

test("stale result content disables every change and says why", () => {
  const stale = resultFacts({ content: "stale" });
  for (const evaluate of resultCapabilities) {
    expect(evaluate(stale)).toEqual({
      status: "disabled",
      reason: "This result could not be refreshed, so changing it cannot be established as safe.",
    });
  }
  // A confirmed lack of authority remains the more useful explanation.
  expect(
    evaluateResultTerminationCapability(resultFacts({ content: "stale", username: observer })),
  ).toEqual({
    status: "disabled",
    reason:
      "You must be a project editor or administrator to stop or delete instances in this project.",
  });
});

test("a project viewer is told what each unavailable result action requires", () => {
  const viewer = resultFacts({ username: observer });

  expect(evaluateResultTerminationCapability(viewer)).toEqual({
    status: "disabled",
    reason:
      "You must be a project editor or administrator to stop or delete instances in this project.",
  });
  expect(evaluateResultArchiveCapability(viewer)).toEqual({
    status: "disabled",
    reason: "You must be a project editor or administrator to archive instances in this project.",
  });
  expect(evaluateResultTaskDeletionCapability(viewer)).toEqual({
    status: "disabled",
    reason: "You must be a project editor or administrator to delete tasks in this project.",
  });
  expect(evaluateResultWorkflowLifecycleCapability(viewer)).toEqual({
    status: "disabled",
    reason:
      "You must be a project editor or administrator to stop or delete workflows in this project.",
  });
  expect(evaluateResultRerunCapability(viewer)).toEqual({
    status: "disabled",
    reason: "You must be a project editor or administrator to run work in this project.",
  });
});

test("a coin limit stops new work without withholding cleanup of work already run", () => {
  const atLimit = resultFacts({ subscription: { accountsForInstances: true, atLimit: true } });

  expect(evaluateResultRerunCapability(atLimit)).toEqual({
    status: "disabled",
    reason: "This project's subscription is at its coin limit, so work cannot be run.",
  });
  expect(evaluateResultTerminationCapability(atLimit)).toEqual({ status: "enabled" });
  expect(evaluateResultTaskDeletionCapability(atLimit)).toEqual({ status: "enabled" });
});

test("unconfirmed caller facts leave ordinary result actions available with their requirement", () => {
  const unresolved = resultFacts({ freshness: "stale", username: undefined });

  expect(evaluateResultTerminationCapability(unresolved)).toEqual({
    status: "enabled",
    reason:
      "You must be a project editor or administrator to stop or delete instances in this project. Your permission will be confirmed when you use this action.",
  });
  // Spending that cannot be established as safe is still explained rather than offered.
  expect(
    evaluateResultRerunCapability({
      ...unresolved,
      subscription: { accountsForInstances: false, atLimit: false },
    }),
  ).toEqual({
    status: "disabled",
    reason:
      "This project's subscription does not account for instances, so running work cannot be established as safe.",
  });
});

test("a collection that fails does not decide what the other collections may show", () => {
  // Each collection is classified on its own, so the section keeps the content it could read.
  const readStates = {
    instances: resolveResultReadState(new Response(null, { status: 403 })),
    tasks: resolveResultReadState(null),
    workflows: resolveResultReadState(new Response(null, { status: 503 })),
  };

  expect(readStates.instances).toEqual({ kind: "unavailable" });
  expect(readStates.tasks).toEqual({ kind: "available" });
  expect(readStates.workflows).toEqual({ kind: "recoverable", retryable: true });
  // The readable collections still contribute their results.
  expect(
    results({
      instances: readStates.instances.kind === "unavailable" ? [] : [instance()],
      workflows: readStates.workflows.kind === "unavailable" ? [] : [workflow()],
    }).map(({ kind }) => kind),
  ).toEqual(["workflow", "task"]);
});

test("one addressed result answers by the same rule as the collection it belongs to", () => {
  expect(resolveResultReadState(new Response(null, { status: 403 }))).toEqual({
    kind: "unavailable",
  });
  expect(resolveResultReadState(new Response(null, { status: 404 }))).toEqual({
    kind: "unavailable",
  });
  expect(resolveResultReadState(new Response(null, { status: 503 }))).toEqual({
    kind: "recoverable",
    retryable: true,
  });
  expect(resolveResultReadState(null)).toEqual({ kind: "available" });
});

test("every displayed result is offered the capabilities its own owning project decides", () => {
  const facts = {
    caller: { isPlatformAdministrator: false, username: editor },
    freshness: "current",
    project: project(),
    subscription: { accountsForInstances: true, atLimit: false },
  } as Parameters<typeof resolveResultCapabilities>[0];

  const owned = resolveResultCapabilities(facts, {
    owningProjectId: projectId,
    routeProjectId: projectId,
  });
  expect(Object.values(owned).every((capability) => capability.status === "enabled")).toBe(true);

  // The same caller, the same addressed project, but a result belonging to another one.
  const foreign = resolveResultCapabilities(facts, {
    owningProjectId: otherProjectId,
    routeProjectId: projectId,
  });
  expect(Object.values(foreign)).toEqual(
    Object.values(foreign).map(() => ({
      status: "disabled",
      reason: "This result belongs to another project, so it cannot be changed from this project.",
    })),
  );

  // Content that could not be refreshed locks the result it describes.
  const stale = resolveResultCapabilities(facts, {
    content: "stale",
    owningProjectId: projectId,
    routeProjectId: projectId,
  });
  expect(stale.termination).toEqual({
    status: "disabled",
    reason: "This result could not be refreshed, so changing it cannot be established as safe.",
  });
});

test("Results state is owned by Results alone and never follows a project or section change", () => {
  const state = { search: "acceptance", types: ["instance"] as const };

  expect(projectLinks.results(projectId, state)).toBe(
    `/projects/${projectId}/results?search=acceptance&type=instance`,
  );
  // A child link keeps the list state it was opened from.
  expect(projectLinks.result(projectId, "instances", instance().id, state)).toBe(
    `/projects/${projectId}/results/instances/${instance().id}?search=acceptance&type=instance`,
  );
  // Another section of the same project starts from its own state, not from Results'.
  expect(projectLinks.files(projectId)).toBe(`/projects/${projectId}/files`);
  expect(projectLinks.run(projectId)).toBe(`/projects/${projectId}/run`);
  expect(projectLinks.manage(projectId)).toBe(`/projects/${projectId}/manage`);
  // Another project's Results start empty; entering a project never carries Results state along.
  expect(projectLinks.results(otherProjectId)).toBe(`/projects/${otherProjectId}/results`);
  expect(projectLinks.entry(otherProjectId)).toBe(`/projects/${otherProjectId}`);
});

test.describe("Results cutover", () => {
  test("the legacy global Results routes no longer exist", () => {
    for (const legacy of ["src/pages/results.tsx", "src/pages/results"]) {
      expect(existsSync(path.join(process.cwd(), legacy))).toBe(false);
    }
    // The parser answers for the removed routes rather than guessing a correction for them.
    for (const href of [
      "/results",
      "/results?project=project-33333333-3333-4333-8333-333333333333",
      `/results/instance/${instance().id}`,
      `/results/task/${task().id}`,
      `/results/workflow/${workflow().id}`,
    ]) {
      expect(parseProjectRoute(href)).toEqual({ kind: "not-found" });
    }
  });

  test("no handwritten module composes a Results route or reads a selected project", () => {
    const typescriptSource = /\.tsx?$/u;
    const generated = /(?:^|\/)generated\//u;
    const root = path.join(process.cwd(), "src");
    const handwrittenMatching = (matches: RegExp) =>
      readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
        .map((entry) =>
          path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
        )
        .filter((file) => !generated.test(file))
        .filter((file) => matches.test(readFileSync(path.join(root, file), "utf8")))
        .toSorted();

    // Composing a legacy Results path, rather than calling the family builder, would be a second
    // owner of the route.
    expect(handwrittenMatching(/["'`]\/results/u)).toEqual([]);
    // The Results family reads the project from the URL alone; the legacy selected-project hooks
    // remain confined to the sections that have not been migrated yet.
    expect(
      handwrittenMatching(/useCurrentProject|useIsUserAdminOrEditorOfCurrentProject/u),
    ).not.toContain("projects/ProjectResults.tsx");
    for (const sourceFile of [
      "projects/ProjectResults.tsx",
      "projects/ProjectResultDetail.tsx",
      "projects/resultFacts.ts",
      "projects/useProjectResults.ts",
      "projects/resultCapabilities.ts",
      "projects/useResultCommands.ts",
      "components/instances/ResultJobCard.tsx",
      "components/instances/ResultApplicationCard.tsx",
      "components/tasks/ResultTaskCard.tsx",
      "components/RunningWorkflowCard/RunningWorkflowCard.tsx",
    ]) {
      expect(readFileSync(path.join(root, sourceFile), "utf8")).not.toMatch(
        /useCurrentProject|useIsUserAdminOrEditorOfCurrentProject|useProjectFromId/u,
      );
    }
  });
});
