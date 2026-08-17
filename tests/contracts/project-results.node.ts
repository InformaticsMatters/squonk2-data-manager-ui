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
  resolveResultsFreshnessByCollection,
  resolveResultsReadReport,
  resultListRequests,
  selectProjectResults,
} from "../../src/projects/resultFacts";
import {
  parseProjectRoute,
  projectLinks,
  type ResultsLinkState,
  resultsListState,
  type ResultsState,
} from "../../src/projects/routes";
import {
  resolveSectionFreshness,
  resolveSectionReadState,
  sectionReadFailure,
} from "../../src/projects/sectionReads";

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
  for (const noFailure of [null, undefined]) {
    expect(resolveSectionReadState(noFailure)).toEqual({ kind: "available" });
  }
  expect(resolveSectionReadState(new Response(null, { status: 403 }))).toEqual({
    kind: "unavailable",
  });
  expect(resolveSectionReadState(new Response(null, { status: 404 }))).toEqual({
    kind: "unavailable",
  });
  for (const status of [429, 500, 503]) {
    expect(resolveSectionReadState(new Response(null, { status }))).toEqual({
      kind: "recoverable",
      retryable: true,
    });
  }
  // An unusable transport fact is never reported as success.
  expect(resolveSectionReadState(new Error("no status"))).toEqual({
    kind: "recoverable",
    retryable: true,
  });

  expect(resolveSectionFreshness({ kind: "available" })).toBe("current");
  expect(resolveSectionFreshness({ kind: "recoverable", retryable: true })).toBe("stale");
  expect(resolveSectionFreshness({ kind: "unavailable" })).toBe("current");
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
    instance: resolveSectionReadState(new Response(null, { status: 403 })),
    task: resolveSectionReadState(null),
    workflow: resolveSectionReadState(new Response(null, { status: 503 })),
  };

  expect(readStates.instance).toEqual({ kind: "unavailable" });
  expect(readStates.task).toEqual({ kind: "available" });
  expect(readStates.workflow).toEqual({ kind: "recoverable", retryable: true });
  // The readable collections still contribute their results.
  expect(
    results({
      instances: readStates.instance.kind === "unavailable" ? [] : [instance()],
      workflows: readStates.workflow.kind === "unavailable" ? [] : [workflow()],
    }).map(({ kind }) => kind),
  ).toEqual(["workflow", "task"]);

  // A refusal on one collection never silences the retry the transient one needs: both outcomes
  // are reported, so the caller is told what was lost *and* offered the retry that can recover.
  expect(resolveResultsReadReport(readStates)).toEqual({ retryable: true, unavailable: true });

  // Only the collection that could not be refreshed is locked. The refused one cleared its content
  // and the readable one stays actionable, so no result is disabled for another collection's read.
  expect(resolveResultsFreshnessByCollection(readStates)).toEqual({
    instance: "current",
    task: "current",
    workflow: "stale",
  });
});

test("a failed refresh is noticed even though the content it left behind is still there", () => {
  const transport = new Response(null, { status: 503 });

  // A read with nothing to show reports its failure as `error`.
  expect(sectionReadFailure({ error: transport, failureReason: null })).toBe(transport);
  // A read whose refresh failed keeps its data and reports the failure as `failureReason` alone.
  // This is the only case in which stale content exists, so missing it would leave content that
  // could not be refreshed looking current and changeable.
  expect(sectionReadFailure({ error: null, failureReason: transport })).toBe(transport);
  expect(
    resolveSectionReadState(sectionReadFailure({ error: null, failureReason: transport })),
  ).toEqual({ kind: "recoverable", retryable: true });
  // A read that succeeded reports neither.
  expect(sectionReadFailure({ error: null, failureReason: null })).toBeNull();
  expect(resolveSectionReadState(sectionReadFailure({ error: null, failureReason: null }))).toEqual(
    { kind: "available" },
  );
});

test("the section reports nothing when every collection answered", () => {
  const readStates = {
    instance: resolveSectionReadState(null),
    task: resolveSectionReadState(null),
    workflow: resolveSectionReadState(null),
  };

  expect(resolveResultsReadReport(readStates)).toEqual({ retryable: false, unavailable: false });
  expect(resolveResultsFreshnessByCollection(readStates)).toEqual({
    instance: "current",
    task: "current",
    workflow: "current",
  });
});

test("one addressed result answers by the same rule as the collection it belongs to", () => {
  expect(resolveSectionReadState(new Response(null, { status: 403 }))).toEqual({
    kind: "unavailable",
  });
  expect(resolveSectionReadState(new Response(null, { status: 404 }))).toEqual({
    kind: "unavailable",
  });
  expect(resolveSectionReadState(new Response(null, { status: 503 }))).toEqual({
    kind: "recoverable",
    retryable: true,
  });
  expect(resolveSectionReadState(null)).toEqual({ kind: "available" });
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

/** The Results route one canonical href parses to, so a test can read the state it carries. */
const resultsRouteFor = (href: string) => {
  const parsed = parseProjectRoute(href);
  if (parsed.kind !== "valid") {
    throw new Error(`${href} must parse as a canonical route`);
  }
  const { route } = parsed;
  if (route.kind !== "results" && route.kind !== "result") {
    throw new Error(`${href} must parse as a Results route`);
  }
  return route;
};

test("Results state resets to the route it is on, so no project inherits another's filters", () => {
  const filtered = resultsRouteFor(
    `/projects/${projectId}/results?search=acceptance&type=instance`,
  );
  const entered = resultsRouteFor(`/projects/${otherProjectId}/results`);

  // The state is read from the route being rendered, never carried over from the previous one, so
  // arriving at a second project's Results resets the filters to that route's own — which is none.
  expect(resultsListState(filtered)).toEqual({ search: "acceptance", types: ["instance"] });
  expect(resultsListState(entered)).toEqual({});

  // Filter state is never a request argument either, so a reset changes what is shown and never
  // what was fetched: both projects issue the same project-constrained reads regardless of state.
  expect(resultListRequests(filtered.projectId)).toEqual(resultListRequests(projectId));
  expect(resultListRequests(entered.projectId)).toEqual(resultListRequests(otherProjectId));
  expect(filterResultItems(results(), resultsListState(entered))).toHaveLength(results().length);
});

const workflowDefinitionId = "workflow-55555555-5555-4555-8555-555555555555";

/** The definition filter one Results href carries, proven present rather than assumed. */
const definitionFilterFor = (href: string) => {
  const { definition } = resultsListState(resultsRouteFor(href));
  if (definition === undefined) {
    throw new Error(`${href} must carry a definition filter`);
  }
  return definition;
};

/** A Results href with the given query state, written by hand rather than by a builder. */
const resultsHref = (query: string) => `/projects/${projectId}/results?${query}`;

/** That a hand-written href names no filter at all, and is corrected to the whole list. */
const expectsNoFilter = (query: string) => {
  const href = resultsHref(query);
  expect(parseProjectRoute(href), href).toEqual({
    kind: "valid",
    route: { kind: "results", projectId },
    canonicalHref: projectLinks.results(projectId),
    needsReplace: true,
  });
};

test("every definition filter shape survives link building and parsing", () => {
  const shapes = [
    { definitionType: "jobs", definitionId: "42" },
    { definitionType: "jobs", definitionId: "42", version: "1.0.0" },
    { definitionType: "applications", definitionId: "jupyter-lab" },
    { definitionType: "workflows", definitionId: workflowDefinitionId },
    { definitionType: "workflows", definitionId: workflowDefinitionId, version: "2" },
  ] as const;

  for (const definition of shapes) {
    const href = projectLinks.results(projectId, { definition });
    expect(parseProjectRoute(href), href).toMatchObject({
      kind: "valid",
      canonicalHref: href,
      needsReplace: false,
    });
    expect(resultsListState(resultsRouteFor(href)), href).toEqual({ definition });
  }

  // The version is what a link spells out, so the absent one is a different link from any present
  // one: all versions of a definition and one of them are not the same list.
  expect(projectLinks.results(projectId, { definition: shapes[0] })).not.toBe(
    projectLinks.results(projectId, { definition: shapes[1] }),
  );
  // The pair absent is the ordinary unfiltered list, which carries no filter keys at all.
  expect(projectLinks.results(projectId)).toBe(`/projects/${projectId}/results`);
  expect(resultsListState(resultsRouteFor(projectLinks.results(projectId)))).toEqual({});
});

test("a definition identifier of the wrong shape for its type carries no filter", () => {
  for (const [definitionType, definitionId] of [
    ["jobs", "not-a-number"],
    ["jobs", "0"],
    ["jobs", workflowDefinitionId],
    ["applications", "Invalid"],
    ["workflows", "not-a-workflow"],
    ["workflows", "42"],
  ] as const) {
    expectsNoFilter(`definitionType=${definitionType}&definitionId=${definitionId}`);
    // The builder refuses the same identifier rather than writing a link that parses back to
    // nothing, so a mistaken caller is told instead of silently getting the unfiltered list.
    expect(() =>
      projectLinks.results(projectId, { definition: { definitionType, definitionId } }),
    ).toThrow();
  }
});

test("a definition type outside the Run definition types carries no filter", () => {
  for (const definitionType of ["instances", "datasets", "JOBS", "job", ""]) {
    expectsNoFilter(`definitionType=${definitionType}&definitionId=42`);
  }
});

test("half a definition filter narrows nothing, whichever half it is", () => {
  for (const query of [
    "definitionType=jobs",
    "definitionId=42",
    "version=1.0.0",
    "definitionId=42&version=1.0.0",
    "definitionType=jobs&version=1.0.0",
    // Neither half may be repeated: two definitions are not a definition.
    "definitionType=jobs&definitionType=workflows&definitionId=42",
    "definitionType=jobs&definitionId=42&definitionId=43",
  ]) {
    expectsNoFilter(query);
  }
});

test("a version that names nothing reverts to every version of the definition", () => {
  const definition = { definitionType: "jobs", definitionId: "42" } as const;

  for (const query of [
    "definitionType=jobs&definitionId=42&version=",
    "definitionType=jobs&definitionId=42&version=1.0.0&version=2.0.0",
  ]) {
    const href = resultsHref(query);
    expect(parseProjectRoute(href), href).toEqual({
      kind: "valid",
      route: { kind: "results", projectId, definition },
      canonicalHref: projectLinks.results(projectId, { definition }),
      needsReplace: true,
    });
  }
  // An unusable version never costs the pair beside it: the definition still narrows the list.
  expect(definitionFilterFor(resultsHref("definitionType=jobs&definitionId=42&version="))).toEqual(
    definition,
  );
});

test("a URL carrying both a definition filter and a type filter keeps the definition alone", () => {
  const definition = { definitionType: "jobs", definitionId: "42" } as const;
  const href = resultsHref("type=instance&definitionType=jobs&definitionId=42&search=docking");

  expect(parseProjectRoute(href)).toEqual({
    kind: "valid",
    route: { kind: "results", projectId, search: "docking", definition },
    canonicalHref: projectLinks.results(projectId, { definition, search: "docking" }),
    needsReplace: true,
  });
  // The definition filter wins, so no type narrowing the caller never chose is left behind.
  expect(resultsListState(resultsRouteFor(href)).types).toBeUndefined();
});

test("the definition filter follows a result and its rerun and comes back with All results", () => {
  const definition = { definitionType: "jobs", definitionId: "42", version: "1.0.0" } as const;
  const state = { definition, search: "docking" };
  const detail = projectLinks.result(projectId, "instances", instance().id, state);
  const rerun = projectLinks.resultRerun(projectId, instance().id, state);

  expect(rerun).toBe(`${detail}&rerun=1`);
  for (const href of [detail, rerun]) {
    expect(resultsListState(resultsRouteFor(href)), href).toEqual(state);
    // "All results" rebuilds the list from what the result route carried, so a filtered list is
    // returned to rather than replaced by the unfiltered one.
    expect(projectLinks.results(projectId, resultsListState(resultsRouteFor(href))), href).toBe(
      projectLinks.results(projectId, state),
    );
  }
});

test("a definition filter is carried by the route without yet narrowing the list", () => {
  const state = resultsListState(
    resultsRouteFor(
      projectLinks.results(projectId, {
        definition: { definitionType: "jobs", definitionId: "42" },
      }),
    ),
  );

  expect(filterResultItems(results(), state)).toHaveLength(results().length);
});

test("a definition filter beside a type filter is unrepresentable, not merely unreachable", () => {
  const definition = definitionFilterFor(
    projectLinks.results(projectId, { definition: { definitionType: "jobs", definitionId: "42" } }),
  );

  // The assertions here are the directives themselves: `pnpm tsc` fails if either stops erroring,
  // so the exclusion cannot quietly become a runtime rule the route type would still admit.
  // @ts-expect-error a route carrying a definition filter carries no type filter at all.
  const contradiction: ResultsState = { definition, types: ["instance"] };
  // @ts-expect-error nor can a link be built from the same contradiction.
  const unbuildable: ResultsLinkState = { definition: { ...definition }, types: ["instance"] };

  expect([contradiction, unbuildable]).toHaveLength(2);
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
      "projects/instanceFacts.ts",
      "projects/taskFacts.ts",
      "projects/useResultInstance.ts",
      "projects/useResultTask.ts",
      "projects/useResultWorkflow.ts",
      "projects/workflowFacts.ts",
      "components/instances/InstanceDetails.tsx",
      "components/instances/InstanceProgress.tsx",
      "components/instances/InstanceResultCard.tsx",
      "components/instances/ResultInstanceDetail.tsx",
      "components/tasks/DeleteTaskButton.tsx",
      "components/tasks/ResultTaskCard.tsx",
      "components/tasks/ResultTaskDetail.tsx",
      "components/tasks/TaskDetails.tsx",
      "components/tasks/TaskProgress.tsx",
      "components/tasks/TaskResultCard.tsx",
      "components/workflows/ResultWorkflowDetail.tsx",
      "components/workflows/ResultWorkflowSteps.tsx",
      "components/workflows/WorkflowResultCard.tsx",
      "components/workflows/WorkflowSteps.tsx",
    ]) {
      expect(readFileSync(path.join(root, sourceFile), "utf8")).not.toMatch(
        /useCurrentProject|useIsUserAdminOrEditorOfCurrentProject|useProjectFromId/u,
      );
    }
  });
});

test("useResultCommands is the only owner of Results mutations and their invalidation", () => {
  const root = path.join(process.cwd(), "src");
  const commandOwner = "projects/useResultCommands.ts";

  // Every component that changes a result routes the change through the one command owner, so
  // no card mutates or invalidates on its own.
  for (const card of [
    "components/instances/ArchiveInstance.tsx",
    "components/instances/TerminateInstance.tsx",
    "components/workflows/WorkflowLifecycleButton.tsx",
    "components/tasks/DeleteTaskButton.tsx",
  ]) {
    const source = readFileSync(path.join(root, card), "utf8");
    expect(source).toContain("useResultCommands");
    expect(source).not.toMatch(/useQueryClient|invalidateQueries/u);
    expect(source).not.toMatch(
      /usePatchInstance|useTerminateInstance|useDeleteTask|useDeleteRunningWorkflow|useStopRunningWorkflow/u,
    );
  }

  // The owner's own collection keys are all built from a project's list request, so a Results
  // command can never invalidate an unprojected — and therefore cross-project — collection.
  const owner = readFileSync(path.join(root, commandOwner), "utf8");
  for (const collectionKey of [
    "getGetInstancesQueryKey",
    "getGetTasksQueryKey",
    "getGetRunningWorkflowsQueryKey",
  ]) {
    expect(owner).toContain(`${collectionKey}(resultListRequests(projectId)`);
    expect(owner).not.toMatch(new RegExp(String.raw`${collectionKey}\(\s*\)`, "u"));
  }
});
