import {
  type ApplicationSummary,
  type InstanceSummary,
  type JobSummary,
  type ProjectDetail,
  type RunningWorkflowSummary,
  type TaskSummary,
  type WorkflowSummary,
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
  type ResolvedResultsDefinition,
  resolveResultsDefinition,
  resolveResultsFreshnessByCollection,
  resolveResultsReadReport,
  resultListRequests,
  type ResultsDefinitionCatalogue,
  resultsDefinitionLabel,
  type ResultsDefinitionTarget,
  resultsFilterStatement,
  resultsShownStatement,
  resultsTypeNarrowing,
  resultTypeLabels,
  selectProjectResults,
  unrunResultsDefinition,
} from "../../src/projects/resultFacts";
import {
  parseProjectRoute,
  projectLinks,
  type ResultsLinkState,
  resultsListState,
  type ResultsState,
  resultsWithoutDefinition,
  type UncheckedDefinitionFilter,
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

const workflow = (overrides: Partial<RunningWorkflowSummary> = {}): RunningWorkflowSummary => ({
  id: "r-workflow-22222222-2222-4222-8222-222222222222",
  name: "Acceptance Workflow",
  project: { id: projectId, name: "Acceptance Project" },
  started: "2026-01-02T04:00:00Z",
  status: "RUNNING",
  workflow: {
    id: "workflow-55555555-5555-4555-8555-555555555555",
    name: "acceptance-workflow",
    version: "1.0.0",
  },
  ...overrides,
});

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
    caller: { username },
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
    caller: { username: editor },
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

const jobDefinition = (overrides: Partial<JobSummary> = {}): JobSummary => ({
  collection: "acceptance",
  disabled: false,
  id: 42,
  image_type: "SIMPLE",
  job: "acceptance-job",
  name: "Acceptance Job",
  required_assets: [],
  version: "1.0.0",
  ...overrides,
});

const workflowDefinition = (overrides: Partial<WorkflowSummary> = {}) =>
  ({
    id: workflowDefinitionId,
    name: "acceptance-workflow",
    scope: "GLOBAL",
    validated: true,
    version: "1.0.0",
    ...overrides,
  }) as WorkflowSummary;

const applicationDefinition = (overrides: Partial<ApplicationSummary> = {}) =>
  ({
    application_id: "jupyter-lab",
    group: "notebooks",
    kind: "JupyterLab",
    ...overrides,
  }) as ApplicationSummary;

/** The catalogues a filter is resolved against; only the one its type names is ever populated. */
const catalogues = (overrides: Partial<ResultsDefinitionCatalogue> = {}) => ({
  applications: [],
  jobs: [],
  workflows: [],
  ...overrides,
});

/** One filter's resolution against the catalogue that publishes its type, read and answered. */
const resolutionOf = (
  definition: UncheckedDefinitionFilter,
  catalogue: Partial<ResultsDefinitionCatalogue> = {},
) =>
  resolveResultsDefinition({
    catalogue: catalogues(catalogue),
    definition,
    isLoading: false,
    readState: { kind: "available" },
  });

/** The definition one filter resolves to, proven resolved rather than assumed. */
const resolvedOf = (
  definition: UncheckedDefinitionFilter,
  catalogue: Partial<ResultsDefinitionCatalogue> = {},
): ResolvedResultsDefinition => {
  const resolution = resolutionOf(definition, catalogue);
  if (resolution.status !== "resolved") {
    throw new Error(`${definition.definitionType} ${definition.definitionId} must resolve`);
  }
  return resolution;
};

/** The version-agnostic identity that definition is matched by. */
const targetOf = (
  definition: UncheckedDefinitionFilter,
  catalogue: Partial<ResultsDefinitionCatalogue> = {},
): ResultsDefinitionTarget => resolvedOf(definition, catalogue).target;

/** One job's instance, carrying the identity every version of that job shares. */
const jobInstance = (id: string, version: string) =>
  instance({
    id,
    job_collection: "acceptance",
    job_job: "acceptance-job",
    job_version: version,
    launched: `2026-01-02T03:0${version.startsWith("1") ? 0 : 1}:00Z`,
  });

const applicationInstance = instance({
  id: "instance-55555555-5555-4555-8555-555555555555",
  application_id: "jupyter-lab",
});

const jobFilter = { definitionType: "jobs", definitionId: "42" } as const;
const applicationFilter = { definitionType: "applications", definitionId: "jupyter-lab" } as const;
const workflowFilter = { definitionType: "workflows", definitionId: workflowDefinitionId } as const;

const definitionCatalogues: Record<string, Partial<ResultsDefinitionCatalogue>> = {
  applications: { applications: [applicationDefinition()] },
  jobs: { jobs: [jobDefinition()] },
  workflows: { workflows: [workflowDefinition()] },
};

test("each definition type matches the one kind of result that carries its identity", () => {
  const owned = results({ instances: [jobInstance("instance-job", "1.0.0"), applicationInstance] });
  const filtered = (
    definition: UncheckedDefinitionFilter,
    catalogue: Partial<ResultsDefinitionCatalogue>,
  ) => filterResultItems(owned, {}, targetOf(definition, catalogue)).map(({ id }) => id);

  expect(filtered(jobFilter, definitionCatalogues.jobs)).toEqual(["instance-job"]);
  expect(filtered(applicationFilter, definitionCatalogues.applications)).toEqual([
    applicationInstance.id,
  ]);
  expect(filtered(workflowFilter, definitionCatalogues.workflows)).toEqual([workflow().id]);
});

test("a result carrying none of a definition's identity can never match its filter", () => {
  const owned = results({ instances: [jobInstance("instance-job", "1.0.0"), applicationInstance] });
  const matched = (
    definition: UncheckedDefinitionFilter,
    catalogue: Partial<ResultsDefinitionCatalogue>,
  ) => filterResultItems(owned, {}, targetOf(definition, catalogue));

  // A task is a dataset or file purpose. It names no job, application or workflow at all, so no
  // definition filter can ever list one.
  for (const [definition, catalogue] of [
    [jobFilter, definitionCatalogues.jobs],
    [applicationFilter, definitionCatalogues.applications],
    [workflowFilter, definitionCatalogues.workflows],
  ] as const) {
    expect(matched(definition, catalogue).map(({ kind }) => kind)).not.toContain("task");
  }

  // A running workflow names no job and no application, and an instance names no workflow
  // definition, so neither is a near miss to be resolved: there is nothing to compare.
  expect(matched(jobFilter, definitionCatalogues.jobs).map(({ kind }) => kind)).toEqual([
    "instance",
  ]);
  expect(
    matched(applicationFilter, definitionCatalogues.applications).map(({ kind }) => kind),
  ).toEqual(["instance"]);
  expect(matched(workflowFilter, definitionCatalogues.workflows).map(({ kind }) => kind)).toEqual([
    "workflow",
  ]);
});

test("an absent version keeps every version of a definition and a present one narrows to it", () => {
  const owned = results({
    instances: [jobInstance("instance-v1", "1.0.0"), jobInstance("instance-v2", "2.0.0")],
    workflows: [
      workflow(),
      workflow({
        id: "r-workflow-v2",
        started: "2026-01-02T05:00:00Z",
        workflow: { ...workflow().workflow, version: "2.0.0" },
      }),
    ],
  });
  const filtered = (
    definition: UncheckedDefinitionFilter,
    catalogue: Partial<ResultsDefinitionCatalogue>,
  ) => filterResultItems(owned, {}, targetOf(definition, catalogue)).map(({ id }) => id);

  // The identifier a URL carries is one version's, so a job's identity is compared on its
  // collection and name: the version-agnostic case stays expressible whichever version was named.
  expect(filtered(jobFilter, definitionCatalogues.jobs)).toEqual(["instance-v2", "instance-v1"]);
  expect(
    filtered(
      { ...jobFilter, definitionId: "43" },
      { jobs: [jobDefinition({ id: 43, version: "2.0.0" })] },
    ),
  ).toEqual(["instance-v2", "instance-v1"]);
  expect(filtered({ ...jobFilter, version: "1.0.0" }, definitionCatalogues.jobs)).toEqual([
    "instance-v1",
  ]);
  expect(filtered({ ...jobFilter, version: "2.0.0" }, definitionCatalogues.jobs)).toEqual([
    "instance-v2",
  ]);
  // A version no execution ran is an empty list rather than a widened one.
  expect(filtered({ ...jobFilter, version: "3.0.0" }, definitionCatalogues.jobs)).toEqual([]);

  expect(filtered(workflowFilter, definitionCatalogues.workflows)).toEqual([
    "r-workflow-v2",
    workflow().id,
  ]);
  expect(filtered({ ...workflowFilter, version: "1.0.0" }, definitionCatalogues.workflows)).toEqual(
    [workflow().id],
  );
});

test("a filtered list shows only the results the project in the URL owns", () => {
  const owned = results({
    instances: [
      jobInstance("instance-job", "1.0.0"),
      { ...jobInstance("instance-foreign", "1.0.0"), project_id: otherProjectId },
    ],
    workflows: [
      workflow(),
      workflow({ id: "r-workflow-foreign", project: { id: otherProjectId, name: "Partner" } }),
    ],
  });

  // Ownership decides before the filter does, so a filter can only ever narrow the project's own
  // results and never reach another project's.
  expect(filterResultItems(owned, {}, targetOf(jobFilter, definitionCatalogues.jobs))).toEqual([
    expect.objectContaining({ id: "instance-job", owningProjectId: projectId }),
  ]);
  expect(
    filterResultItems(owned, {}, targetOf(workflowFilter, definitionCatalogues.workflows)).map(
      ({ id }) => id,
    ),
  ).toEqual([workflow().id]);
});

test("the search box still narrows within a filtered list", () => {
  const owned = results({
    instances: [
      jobInstance("instance-completed", "1.0.0"),
      {
        ...jobInstance("instance-failed", "1.0.0"),
        launched: "2026-01-02T03:30:00Z",
        name: "Retry",
        phase: "FAILED",
      },
    ],
  });
  const target = targetOf(jobFilter, definitionCatalogues.jobs);

  expect(filterResultItems(owned, {}, target).map(({ id }) => id)).toEqual([
    "instance-failed",
    "instance-completed",
  ]);
  expect(filterResultItems(owned, { search: "failed" }, target).map(({ id }) => id)).toEqual([
    "instance-failed",
  ]);
  // The two narrowings compose rather than replace one another: a search still cannot reach a
  // result the filter excluded.
  expect(filterResultItems(owned, { search: "acceptance workflow" }, target)).toEqual([]);
});

test("the results list requests are unchanged by the presence of a definition filter", () => {
  const filtered = resultsRouteFor(
    projectLinks.results(projectId, { definition: { ...jobFilter, version: "1.0.0" } }),
  );
  const unfiltered = resultsRouteFor(projectLinks.results(projectId));

  // The narrowing is entirely client-side. The Data Manager's running-workflow collection does
  // accept a workflow argument and it is deliberately not used: an argument that varied with view
  // state would split one project's Results into several cache identities with independent
  // freshness, retry and refresh behaviour.
  expect(resultListRequests(filtered.projectId)).toEqual(resultListRequests(unfiltered.projectId));
  expect(getGetInstancesQueryKey(resultListRequests(filtered.projectId).instances)).toEqual(
    getGetInstancesQueryKey(resultListRequests(unfiltered.projectId).instances),
  );
  expect(getGetTasksQueryKey(resultListRequests(filtered.projectId).tasks)).toEqual(
    getGetTasksQueryKey(resultListRequests(unfiltered.projectId).tasks),
  );
  expect(getGetRunningWorkflowsQueryKey(resultListRequests(filtered.projectId).workflows)).toEqual(
    getGetRunningWorkflowsQueryKey(resultListRequests(unfiltered.projectId).workflows),
  );
});

test("the definition catalogue is read only while a filter is set and answers for itself", () => {
  const read = (
    overrides: Partial<Parameters<typeof resolveResultsDefinition>[0]> = {},
  ): ReturnType<typeof resolveResultsDefinition> =>
    resolveResultsDefinition({
      catalogue: catalogues(definitionCatalogues.jobs),
      definition: jobFilter,
      isLoading: false,
      readState: { kind: "available" },
      ...overrides,
    });

  // No filter, no read: the unfiltered page pays nothing for a feature it is not using.
  expect(read({ definition: undefined })).toEqual({ status: "unfiltered" });
  // A filtered list cannot be shown before the definition it narrows to is known.
  expect(read({ isLoading: true })).toEqual({ status: "pending" });
  expect(read()).toEqual({
    status: "resolved",
    content: "current",
    name: "acceptance-job",
    target: { definitionType: "jobs", collection: "acceptance", job: "acceptance-job" },
  });
  // Content that could not be refreshed is still worth resolving against, and says it is stale on
  // exactly the same terms as the results collections beside it.
  expect(read({ readState: { kind: "recoverable", retryable: true } })).toMatchObject({
    status: "resolved",
    content: "stale",
  });
  // A refusal clears the catalogue and a failure never fills it, so neither one's silence is ever
  // reported as proof that the definition never existed.
  for (const readState of [
    { kind: "unavailable" },
    { kind: "recoverable", retryable: true },
  ] as const) {
    expect(read({ catalogue: catalogues(), readState })).toEqual({ status: "unreadable" });
  }
  // A catalogue that answered and does not contain the identifier is the one case that is.
  expect(read({ catalogue: catalogues() })).toEqual({ status: "not-found" });
});

test("a definition the catalogue does not contain leaves a usable, unfiltered Results page", () => {
  const owned = results({ instances: [jobInstance("instance-job", "1.0.0")] });
  const resolution = resolutionOf(jobFilter);

  expect(resolution).toEqual({ status: "not-found" });
  // Nothing resolved, so nothing narrows: the caller who followed a stale link keeps the whole
  // list rather than an empty one they cannot explain.
  expect(
    filterResultItems(
      owned,
      resultsListState(resultsRouteFor(projectLinks.results(projectId, { definition: jobFilter }))),
    ),
  ).toHaveLength(owned.length);
});

test("a filter is stated by the name its own catalogue publishes, never by what the URL carries", () => {
  // The name is the catalogue entry's, so a definition renamed since a link was written is stated
  // by the name it has now rather than by anything the URL froze into it.
  expect(
    resultsDefinitionLabel(
      resolvedOf(jobFilter, { jobs: [jobDefinition({ job: "renamed-job", name: "Renamed Job" })] }),
    ),
  ).toBe("Job: renamed-job");
  expect(
    resultsDefinitionLabel(resolvedOf(applicationFilter, definitionCatalogues.applications)),
  ).toBe("Application: JupyterLab");
  expect(resultsDefinitionLabel(resolvedOf(workflowFilter, definitionCatalogues.workflows))).toBe(
    "Workflow: acceptance-workflow",
  );

  // A version the URL narrowed to is stated beside the name; its absence states the definition
  // alone, because the filter then means every version of it.
  expect(
    resultsDefinitionLabel(
      resolvedOf({ ...jobFilter, version: "2.0.0" }, definitionCatalogues.jobs),
    ),
  ).toBe("Job: acceptance-job (2.0.0)");
  expect(resultsDefinitionLabel(resolvedOf(jobFilter, definitionCatalogues.jobs))).toBe(
    "Job: acceptance-job",
  );

  // Nothing that failed to resolve is ever stated: a name the caller could read exists only where
  // an answering catalogue produced one.
  for (const resolution of [
    resolutionOf(jobFilter),
    resolveResultsDefinition({
      catalogue: catalogues(definitionCatalogues.jobs),
      definition: jobFilter,
      isLoading: true,
      readState: { kind: "available" },
    }),
  ]) {
    expect(resolution).not.toMatchObject({ status: "resolved" });
  }
});

test("the name a filter is stated by is available in exactly the case nothing matched", () => {
  const owned = results({ instances: [jobInstance("instance-v1", "1.0.0")] });
  const unrun = resolvedOf({ ...jobFilter, version: "3.0.0" }, definitionCatalogues.jobs);

  // A name taken from a matched result would be unavailable here, which is the one case a caller
  // most needs it: an empty list has to say which definition has never run rather than only that
  // something is missing.
  expect(filterResultItems(owned, {}, unrun.target)).toEqual([]);
  expect(resultsDefinitionLabel(unrun)).toBe("Job: acceptance-job (3.0.0)");
  expect(unrunResultsDefinition(owned, unrun)).toBe(unrun);
});

test("an empty list names the definition only where the definition itself emptied it", () => {
  const owned = results({ instances: [jobInstance("instance-v1", "1.0.0")] });
  const ran = resolvedOf({ ...jobFilter, version: "1.0.0" }, definitionCatalogues.jobs);

  // A search the caller typed can empty a list the definition has plenty in. Stating their own
  // narrowing as "this definition has never run here" would be false, so it is not stated.
  expect(filterResultItems(owned, { search: "nothing matches this" }, ran.target)).toEqual([]);
  expect(unrunResultsDefinition(owned, ran)).toBeUndefined();

  // Nothing to name at all where no definition resolved, whatever emptied the list.
  for (const resolution of [
    resolutionOf(jobFilter),
    { status: "unfiltered" },
    { status: "unreadable" },
  ] as const) {
    expect(unrunResultsDefinition([], resolution)).toBeUndefined();
  }
});

test("an active filter is stated and clearable even where the catalogue could not name it", () => {
  // A filter that resolved is stated by the definition it named.
  expect(resultsFilterStatement(jobFilter, resolvedOf(jobFilter, definitionCatalogues.jobs))).toBe(
    "Job: acceptance-job",
  );

  // One that did not is still stated, by the kind of filter the URL does name — never by a
  // definition name, which only an answering catalogue can supply. The definition filter displaces
  // the type filter, so a caller left without both controls could only reach the whole list by
  // editing the URL.
  for (const resolution of [resolutionOf(jobFilter), { status: "unreadable" }] as const) {
    expect(resultsFilterStatement(jobFilter, resolution)).toBe("Job filter");
  }
  expect(resultsFilterStatement(workflowFilter, { status: "unreadable" })).toBe("Workflow filter");

  // Nothing is stated where there is nothing to state: no filter, or a read still outstanding.
  expect(resultsFilterStatement(undefined, { status: "unfiltered" })).toBeUndefined();
  expect(resultsFilterStatement(jobFilter, { status: "pending" })).toBeUndefined();
});

test("the type filter states every type and no type as the one narrowing they both are", () => {
  const everyType = ["workflow", "task", "instance"] as const;

  // A route carries the types it narrows to, so "all of them" and "none of them" are the same
  // absent value. The control therefore states both the same way rather than reading back a
  // selection of every label it offers as though the caller had chosen it.
  expect(resultsTypeNarrowing([])).toBeUndefined();
  expect(resultsTypeNarrowing(everyType)).toBeUndefined();
  expect(resultsTypeNarrowing(["workflow"])).toEqual(["workflow"]);
  expect(resultsTypeNarrowing(["task", "instance"])).toEqual(["task", "instance"]);

  // What narrows nothing shows every result, so the two agree about the list as well as the label.
  const owned = results({
    instances: [jobInstance("instance-v1", "1.0.0")],
    tasks: [task()],
    workflows: [workflow()],
  });
  expect(filterResultItems(owned, { types: resultsTypeNarrowing(everyType) })).toEqual(owned);
  expect(filterResultItems(owned, { types: resultsTypeNarrowing([]) })).toEqual(owned);

  // Every type the section narrows by is named in one place, whether the filter offers it or a
  // chip states it.
  expect(resultTypeLabels).toEqual({ instance: "Instances", task: "Tasks", workflow: "Workflows" });
});

test("the heading counts what the narrowing left against what the project has", () => {
  // Nothing is narrowed, so the count is the whole list stated once rather than as a fraction of
  // itself.
  expect(resultsShownStatement(12, 12)).toBe("12 results");
  expect(resultsShownStatement(1, 1)).toBe("1 result");
  expect(resultsShownStatement(0, 0)).toBe("0 results");

  // Something is narrowed, so both halves are stated: how much is left, and of how much.
  expect(resultsShownStatement(3, 12)).toBe("3 of 12");
  expect(resultsShownStatement(0, 12)).toBe("0 of 12");
});

test("clearing a definition filter removes all three of its keys and leaves no other filter", () => {
  const filtered: ResultsLinkState = {
    search: "acceptance",
    definition: { definitionType: "jobs", definitionId: "42", version: "1.0.0" },
  };
  const cleared = resultsWithoutDefinition(filtered);

  // All three keys go together: none of them narrows anything without the others.
  expect(cleared).toEqual({ search: "acceptance" });
  expect(projectLinks.results(projectId, cleared)).toBe(
    projectLinks.results(projectId, { search: "acceptance" }),
  );
  for (const key of ["definitionType", "definitionId", "version"]) {
    expect(projectLinks.results(projectId, cleared)).not.toContain(key);
  }

  // Nothing is left in their place. The two narrowings are mutually exclusive in the route, so a
  // cleared filter cannot strand a type narrowing the caller never chose.
  expect(resultsWithoutDefinition({ definition: { ...jobFilter } })).toEqual({});
  expect(
    projectLinks.results(projectId, resultsWithoutDefinition({ definition: { ...jobFilter } })),
  ).toBe(projectLinks.results(projectId));
  // And the cleared state is one the parser reads back as the unfiltered list.
  const route = resultsRouteFor(projectLinks.results(projectId, cleared));
  expect(resultsListState(route)).toEqual({ search: "acceptance" });
  expect(route.definition).toBeUndefined();
});

test("the definition catalogue read is reported beside the collections without deciding for them", () => {
  const readStates = {
    instance: resolveSectionReadState(null),
    task: resolveSectionReadState(null),
    workflow: resolveSectionReadState(null),
  };

  // A read that was never issued reports nothing at all.
  expect(resolveResultsReadReport(readStates)).toEqual({ retryable: false, unavailable: false });
  // One that failed is reported and retried on the same terms as any collection.
  expect(
    resolveResultsReadReport(
      readStates,
      resolveSectionReadState(new Response(null, { status: 503 })),
    ),
  ).toEqual({ retryable: true, unavailable: false });
  expect(
    resolveResultsReadReport(
      readStates,
      resolveSectionReadState(new Response(null, { status: 403 })),
    ),
  ).toEqual({ retryable: false, unavailable: true });

  // Its failure decides nothing about the collections: their content is neither cleared nor locked,
  // and the results that answered stay on screen rather than being narrowed by a definition nothing
  // could resolve.
  expect(resolveResultsFreshnessByCollection(readStates)).toEqual({
    instance: "current",
    task: "current",
    workflow: "current",
  });
  expect(
    resolveResultsDefinition({
      catalogue: catalogues(),
      definition: jobFilter,
      isLoading: false,
      readState: resolveSectionReadState(new Response(null, { status: 403 })),
    }),
  ).toEqual({ status: "unreadable" });
  expect(filterResultItems(results(), {}, undefined)).toHaveLength(results().length);
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
