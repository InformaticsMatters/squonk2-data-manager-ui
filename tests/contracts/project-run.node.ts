import {
  type ApplicationSummary,
  type InstanceSummary,
  type JobSummary,
  type RunningWorkflowSummary,
  type WorkflowSummary,
} from "@/api/data-manager";
import { getGetInstancesQueryKey } from "@/api/data-manager/instance";
import { getGetJobsQueryKey } from "@/api/data-manager/job";
import { getGetRunningWorkflowsQueryKey } from "@/api/data-manager/workflow";

import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  evaluateRunLaunchCapability,
  type ProjectCapabilityFacts,
  type ProjectRunFacts,
} from "../../src/projects/capabilities";
import { parseProjectRoute, projectLinks, runCatalogueState } from "../../src/projects/routes";
import {
  resolveDefinitionCapabilities,
  resolveRunCapabilities,
} from "../../src/projects/runCapabilities";
import {
  countRunDefinitionExecutions,
  filterRunItems,
  findRunDefinition,
  resolveRunFreshnessByType,
  runCatalogueOf,
  runCatalogueRequests,
  runDefinitionExecutionFilter,
  type RunDefinitionSelection,
  runDefinitionUnavailability,
  runExecutionCountStatement,
  type RunExecutions,
  runInstanceExecutions,
  runRunningWorkflowExecutions,
  selectRunCatalogue,
} from "../../src/projects/runFacts";
import { resolveSectionReadReport, resolveSectionReadState } from "../../src/projects/sectionReads";

const projectId = "project-33333333-3333-4333-8333-333333333333";
const otherProjectId = "project-99999999-9999-4999-8999-999999999999";
const workflowId = "workflow-55555555-5555-4555-8555-555555555555";
const editor = "editor@example.org";
const observer = "observer@example.org";

const application = (overrides: Partial<ApplicationSummary> = {}): ApplicationSummary => ({
  application_id: "jupyter-lab",
  group: "notebooks",
  kind: "JupyterNotebook",
  ...overrides,
});

const job = (overrides: Partial<JobSummary> = {}) =>
  ({
    collection: "acceptance",
    description: "Docks a library against a protein",
    disabled: false,
    id: 42,
    job: "acceptance-job",
    keywords: ["docking"],
    name: "Acceptance Job",
    required_assets: [],
    version: "1.0.0",
    ...overrides,
  }) as JobSummary;

const workflow = (overrides: Partial<WorkflowSummary> = {}) =>
  ({
    id: workflowId,
    name: "acceptance-workflow",
    validated: true,
    workflow_description: "Screens a library",
    workflow_name: "Acceptance Workflow",
    ...overrides,
  }) as WorkflowSummary;

const instance = (overrides: Partial<InstanceSummary> = {}) =>
  ({
    application_id: "acceptance-application",
    id: "instance-11111111-1111-4111-8111-111111111111",
    job_collection: "acceptance",
    job_job: "acceptance-job",
    job_name: "Acceptance Job",
    launched: "2026-01-02T03:00:00Z",
    name: "Job run",
    phase: "COMPLETED",
    project_id: projectId,
    ...overrides,
  }) as InstanceSummary;

const runningWorkflow = (
  overrides: Partial<RunningWorkflowSummary> = {},
): RunningWorkflowSummary => ({
  id: "r-workflow-22222222-2222-4222-8222-222222222222",
  name: "Acceptance Workflow",
  project: { id: projectId, name: "Acceptance Project" },
  started: "2026-01-02T04:00:00Z",
  status: "RUNNING",
  workflow: { id: workflowId, name: "acceptance-workflow", version: "1.0.0" },
  ...overrides,
});

const catalogue = (input: Partial<Parameters<typeof selectRunCatalogue>[0]> = {}) =>
  selectRunCatalogue({
    applications: [application()],
    jobs: [job()],
    workflows: [workflow()],
    ...input,
  });

test("every project-scoped Run read names the project in the URL and caches under it", () => {
  const requests = runCatalogueRequests(projectId);

  expect(requests).toEqual({
    instances: { project_id: projectId },
    jobs: { project_id: projectId },
    runningWorkflows: { project_id: projectId },
  });
  // The generated key factories are the only cache identity, and each key carries the project, so
  // two projects can never share a Run cache entry.
  expect(getGetJobsQueryKey(requests.jobs)).not.toEqual(
    getGetJobsQueryKey(runCatalogueRequests(otherProjectId).jobs),
  );
  expect(getGetInstancesQueryKey(requests.instances)).not.toEqual(
    getGetInstancesQueryKey(runCatalogueRequests(otherProjectId).instances),
  );
  expect(getGetRunningWorkflowsQueryKey(requests.runningWorkflows)).not.toEqual(
    getGetRunningWorkflowsQueryKey(runCatalogueRequests(otherProjectId).runningWorkflows),
  );
  for (const request of Object.values(requests)) {
    expect(request.project_id).toBe(projectId);
  }
});

test("the catalogue offers one card per definition, newest job version first", () => {
  const items = catalogue({
    jobs: [job({ id: 1, version: "1.0.0" }), job({ id: 2, version: "2.1.0" })],
  });

  expect(items.map(({ definitionType, id, title }) => ({ definitionType, id, title }))).toEqual([
    { definitionType: "workflows", id: workflowId, title: "Acceptance Workflow" },
    { definitionType: "applications", id: "jupyter-lab", title: "JupyterNotebook" },
    { definitionType: "jobs", id: "2", title: "acceptance-job" },
  ]);
});

test("a job version another replaces is not offered again", () => {
  const items = catalogue({
    jobs: [
      job({ id: 1, replaced_by: [{ collection: "acceptance", job: "acceptance-job" }] }),
      job({ id: 2, version: "2.0.0" }),
    ],
  });

  const jobs = items.filter((item) => item.kind === "job");
  expect(jobs).toHaveLength(1);
  expect(jobs[0].data.map(({ id }) => id)).toEqual([2]);
});

test("a job version the Data Manager did not publish as semver is still offered", () => {
  const items = catalogue({
    jobs: [job({ id: 1, version: "latest" }), job({ id: 2, version: "b" })],
  });
  const jobs = items.filter((item) => item.kind === "job");

  expect(jobs).toHaveLength(1);
  expect(jobs[0].data.map(({ version }) => version)).toEqual(["latest", "b"]);
});

test("the catalogue is narrowed by the state the Run route carries and nothing else", () => {
  const items = catalogue();

  expect(filterRunItems(items, { types: ["job"] }).map(({ kind }) => kind)).toEqual(["job"]);
  expect(filterRunItems(items, { search: "docking" }).map(({ kind }) => kind)).toEqual(["job"]);
  expect(filterRunItems(items, { search: "screens" }).map(({ kind }) => kind)).toEqual([
    "workflow",
  ]);
  expect(filterRunItems(items, { search: "notebooks" }).map(({ kind }) => kind)).toEqual([
    "application",
  ]);
  // A search matching nothing narrows the catalogue rather than changing what was fetched.
  expect(filterRunItems(items, { search: "nothing-matches-this" })).toEqual([]);
  expect(filterRunItems(items)).toHaveLength(items.length);
});

test("a definition route addresses the definition its own catalogue entry offers", () => {
  const items = catalogue({
    jobs: [job({ id: 1, version: "1.0.0" }), job({ id: 2, version: "2.0.0" })],
  });

  expect(findRunDefinition(items, "applications", "jupyter-lab")?.kind).toBe("application");
  expect(findRunDefinition(items, "workflows", workflowId)?.kind).toBe("workflow");
  // Every version of a job is addressable, including the one the card is not headed by.
  expect(findRunDefinition(items, "jobs", "1")?.kind).toBe("job");
  expect(findRunDefinition(items, "jobs", "2")?.kind).toBe("job");
  // Identity is never guessed across definition types, and an identity the catalogue does not
  // offer is simply absent.
  expect(findRunDefinition(items, "applications", workflowId)).toBeUndefined();
  expect(findRunDefinition(items, "jobs", "404")).toBeUndefined();
});

/** A collection whose own read answered, which is the only outcome a badge may count. */
const answered = { isLoading: false, readState: resolveSectionReadState(null) };

const selectedJob = (overrides: Partial<JobSummary> = {}): RunDefinitionSelection => ({
  kind: "job",
  job: job(overrides),
});

const badgeLink = (selection: RunDefinitionSelection) =>
  projectLinks.results(projectId, { definition: runDefinitionExecutionFilter(selection).filter });

const badgeCount = (selection: RunDefinitionSelection, executions: RunExecutions) =>
  countRunDefinitionExecutions(executions, runDefinitionExecutionFilter(selection).target);

test("a card's badge counts its definition's executions by the rule Results matches them", () => {
  const instances = runInstanceExecutions(
    answered,
    [
      instance({ id: "instance-v1", job_version: "1.0.0" }),
      instance({ id: "instance-v1-again", job_version: "1.0.0" }),
      instance({ id: "instance-v2", job_version: "2.0.0" }),
      instance({ id: "instance-other-job", job_job: "another-job", job_version: "1.0.0" }),
      instance({ id: "instance-foreign", job_version: "1.0.0", project_id: otherProjectId }),
      instance({
        application_id: "jupyter-lab",
        id: "instance-application",
        job_collection: undefined,
        job_job: undefined,
      }),
    ],
    projectId,
  );
  const runningWorkflows = runRunningWorkflowExecutions(
    answered,
    [
      runningWorkflow(),
      runningWorkflow({ id: "r-workflow-again" }),
      runningWorkflow({
        id: "r-workflow-foreign",
        project: { id: otherProjectId, name: "Partner" },
      }),
      runningWorkflow({
        id: "r-workflow-other",
        workflow: { id: "workflow-other", name: "other", version: "1.0.0" },
      }),
    ],
    projectId,
  );
  const applicationSelection: RunDefinitionSelection = {
    kind: "application",
    application: application(),
  };
  const workflowSelection: RunDefinitionSelection = { kind: "workflow", workflow: workflow() };

  // A job card counts the version selected on it; an application card every instance of its
  // application, and a workflow card every running workflow of its definition. None of them counts
  // another project's work, whatever the response declared.
  expect(badgeCount(selectedJob({ version: "1.0.0" }), instances)).toEqual({
    status: "counted",
    count: 2,
  });
  expect(badgeCount(selectedJob({ id: 43, version: "2.0.0" }), instances)).toEqual({
    status: "counted",
    count: 1,
  });
  expect(badgeCount(applicationSelection, instances)).toEqual({ status: "counted", count: 1 });
  expect(badgeCount(workflowSelection, runningWorkflows)).toEqual({ status: "counted", count: 2 });

  // Exactly one kind of execution can be an execution of each definition type, so the kinds that
  // carry no identity to compare are counted by nobody rather than by everybody.
  expect(badgeCount(workflowSelection, instances)).toEqual({ status: "counted", count: 0 });
  expect(badgeCount(selectedJob({ version: "1.0.0" }), runningWorkflows)).toEqual({
    status: "counted",
    count: 0,
  });
  expect(badgeCount(applicationSelection, runningWorkflows)).toEqual({
    status: "counted",
    count: 0,
  });
});

test("a badge links to the Results list of what it counted, per definition type", () => {
  // A job card's link carries the version it counted, so following the badge cannot land on a list
  // that disagrees with the number on it. The other two cards represent a whole definition, so
  // neither writes a version at all.
  expect(badgeLink(selectedJob({ id: 42, version: "1.0.0" }))).toBe(
    `/projects/${projectId}/results?definitionType=jobs&definitionId=42&version=1.0.0`,
  );
  expect(badgeLink({ kind: "application", application: application() })).toBe(
    `/projects/${projectId}/results?definitionType=applications&definitionId=jupyter-lab`,
  );
  expect(badgeLink({ kind: "workflow", workflow: workflow() })).toBe(
    `/projects/${projectId}/results?definitionType=workflows&definitionId=${workflowId}`,
  );
});

test("changing a job card's version changes its count and its link together", () => {
  const instances = runInstanceExecutions(
    answered,
    [
      instance({ id: "instance-v1", job_version: "1.0.0" }),
      instance({ id: "instance-v2", job_version: "2.0.0" }),
      instance({ id: "instance-v2-again", job_version: "2.0.0" }),
    ],
    projectId,
  );

  for (const [selection, count, href] of [
    [selectedJob({ id: 1, version: "1.0.0" }), 1, "definitionId=1&version=1.0.0"],
    [selectedJob({ id: 2, version: "2.0.0" }), 2, "definitionId=2&version=2.0.0"],
  ] as const) {
    expect(badgeCount(selection, instances)).toEqual({ status: "counted", count });
    expect(badgeLink(selection)).toBe(`/projects/${projectId}/results?definitionType=jobs&${href}`);
  }
});

test("a job version no URL could carry costs the card its narrowing, never the catalogue", () => {
  const instances = runInstanceExecutions(
    answered,
    [
      instance({ id: "instance-v1", job_version: "1.0.0" }),
      instance({ id: "instance-unpublished", job_version: "" }),
    ],
    projectId,
  );
  const unversioned = selectedJob({ id: 7, version: "" });

  // A card whose version a URL cannot carry still counts and still links — version-agnostically,
  // both together — rather than throwing the whole catalogue away over one definition.
  expect(badgeLink(unversioned)).toBe(
    `/projects/${projectId}/results?definitionType=jobs&definitionId=7`,
  );
  expect(badgeCount(unversioned, instances)).toEqual({ status: "counted", count: 2 });
});

test("a badge waits on the collection it counts and never presents a failed read as none", () => {
  const jobSelection = selectedJob({ version: "1.0.0" });
  const read = (readState: ReturnType<typeof resolveSectionReadState>, isLoading = false) =>
    runInstanceExecutions(
      { isLoading, readState },
      [instance({ job_version: "1.0.0" })],
      projectId,
    );

  expect(badgeCount(jobSelection, read(resolveSectionReadState(null), true))).toEqual({
    status: "pending",
  });
  expect(
    badgeCount(jobSelection, read(resolveSectionReadState(new Response(null, { status: 403 })))),
  ).toEqual({ status: "unreadable" });
  // Content an earlier read left behind is not counted either: a bare number has nowhere to say it
  // could not be refreshed, so it is withheld rather than offered as this project's answer.
  expect(
    badgeCount(jobSelection, read(resolveSectionReadState(new Response(null, { status: 503 })))),
  ).toEqual({ status: "unreadable" });
  // A read that answered with nothing is the one outcome that establishes zero.
  expect(badgeCount(jobSelection, runInstanceExecutions(answered, [], projectId))).toEqual({
    status: "counted",
    count: 0,
  });

  // A card waits only on the collection it actually counts, so a slow running-workflow read never
  // holds up a job card's badge, or the other way round.
  const workflowSelection: RunDefinitionSelection = { kind: "workflow", workflow: workflow() };
  const outstandingWorkflows = runRunningWorkflowExecutions(
    { isLoading: true, readState: resolveSectionReadState(null) },
    [],
    projectId,
  );
  const countedWorkflows = runRunningWorkflowExecutions(answered, [runningWorkflow()], projectId);
  expect(badgeCount(jobSelection, read(resolveSectionReadState(null)))).toEqual({
    status: "counted",
    count: 1,
  });
  expect(badgeCount(workflowSelection, outstandingWorkflows)).toEqual({ status: "pending" });
  expect(badgeCount(workflowSelection, countedWorkflows)).toEqual({ status: "counted", count: 1 });
  expect(badgeCount(jobSelection, read(resolveSectionReadState(null), true))).toEqual({
    status: "pending",
  });
});

/** What the badge of a job card offering version 1.0.0 states about the executions it was given. */
const statementFor = (executions: RunExecutions) => {
  const { name, target } = runDefinitionExecutionFilter(selectedJob({ version: "1.0.0" }));
  return runExecutionCountStatement(countRunDefinitionExecutions(executions, target), name);
};

test("a badge states each outcome distinctly and never spells one as another", () => {
  const instances = (...ids: string[]) =>
    runInstanceExecutions(
      answered,
      ids.map((id) => instance({ id, job_version: "1.0.0" })),
      projectId,
    );

  // The number shown and the statement it is announced by come from one rule, so a caller who
  // reads the badge and one who hears it are told the same thing.
  expect(statementFor(instances("instance-one"))).toEqual({
    description: "1 execution of acceptance-job",
    text: "1 execution",
  });
  expect(statementFor(instances("instance-one", "instance-two"))).toEqual({
    description: "2 executions of acceptance-job",
    text: "2 executions",
  });
  // Known zero is a number like any other; an outstanding read and a failed one are not numbers at
  // all, so neither is spelled as one.
  expect(statementFor(instances())).toEqual({
    description: "0 executions of acceptance-job",
    text: "0 executions",
  });
  expect(
    statementFor(
      runInstanceExecutions({ isLoading: true, readState: answered.readState }, [], projectId),
    ),
  ).toEqual({ description: "Counting executions of acceptance-job" });
  expect(
    statementFor(
      runInstanceExecutions(
        {
          isLoading: false,
          readState: resolveSectionReadState(new Response(null, { status: 503 })),
        },
        [],
        projectId,
      ),
    ),
  ).toEqual({ description: "Executions of acceptance-job could not be read" });
});

test("the badges' counts add no read of their own to the Run section", () => {
  const root = path.join(process.cwd(), "src");

  // A count is a pure fact of executions the composition already holds, so the section's reads are
  // exactly the five it made before any card had a badge.
  expect(
    readFileSync(path.join(root, "projects/useProjectRun.ts"), "utf8").match(/useGet\w+\(/gu),
  ).toEqual([
    "useGetApplications(",
    "useGetJobs(",
    "useGetWorkflows(",
    "useGetInstances(",
    "useGetRunningWorkflows(",
  ]);
  // The badge and the cards that carry it are given what they count, so none of them reads at all.
  for (const component of [
    "components/runCards/ExecutionCountBadge.tsx",
    "components/runCards/ApplicationCard/ApplicationCard.tsx",
    "components/runCards/JobCard/JobCard.tsx",
    "components/runCards/WorkflowCard/WorkflowCard.tsx",
  ]) {
    expect(readFileSync(path.join(root, component), "utf8")).not.toMatch(
      /useGet\w+\(|useQuery|useSuspense/u,
    );
  }
});

const runFacts = ({
  content,
  definitionUnavailability,
  freshness = "current",
  subscription = { accountsForInstances: true, atLimit: false },
  username = editor,
}: Partial<ProjectRunFacts> & { username?: string } = {}): ProjectRunFacts => ({
  caller: { isPlatformAdministrator: false, username },
  content,
  definitionUnavailability,
  freshness,
  project: { administrators: [editor], creator: editor, editors: [editor], observers: [observer] },
  subscription,
});

test("a project editor may run a definition of the project in the URL", () => {
  expect(evaluateRunLaunchCapability(runFacts())).toEqual({ status: "enabled" });
});

test("a project observer is told what running a definition requires", () => {
  expect(evaluateRunLaunchCapability(runFacts({ username: observer }))).toEqual({
    status: "disabled",
    reason: "You must be a project editor or administrator to run work in this project.",
  });
});

test("a definition the Data Manager disabled cannot be run, whatever authority is held", () => {
  const unavailable = "Its container image is missing.";

  expect(evaluateRunLaunchCapability(runFacts({ definitionUnavailability: unavailable }))).toEqual({
    status: "disabled",
    reason: unavailable,
  });
  // A confirmed lack of authority remains the more useful explanation.
  expect(
    evaluateRunLaunchCapability(
      runFacts({ definitionUnavailability: unavailable, username: observer }),
    ),
  ).toEqual({
    status: "disabled",
    reason: "You must be a project editor or administrator to run work in this project.",
  });
});

test("a catalogue that could not be refreshed cannot be launched from", () => {
  expect(evaluateRunLaunchCapability(runFacts({ content: "stale" }))).toEqual({
    status: "disabled",
    reason: "This definition could not be refreshed, so running it cannot be established as safe.",
  });
});

test("a coin limit and a subscription without instance accounting each explain themselves", () => {
  expect(
    evaluateRunLaunchCapability(
      runFacts({ subscription: { accountsForInstances: true, atLimit: true } }),
    ),
  ).toEqual({
    status: "disabled",
    reason: "This project's subscription is at its coin limit, so work cannot be run.",
  });
  expect(
    evaluateRunLaunchCapability(
      runFacts({ subscription: { accountsForInstances: false, atLimit: false } }),
    ),
  ).toEqual({
    status: "disabled",
    reason:
      "This project's subscription does not account for instances, so running work cannot be established as safe.",
  });
});

test("unconfirmed caller facts leave the launch available with its requirement", () => {
  expect(
    evaluateRunLaunchCapability(runFacts({ freshness: "stale", username: undefined })),
  ).toEqual({
    status: "enabled",
    reason:
      "You must be a project editor or administrator to run work in this project. Your permission will be confirmed when you use this action.",
  });
});

test("the section resolves one definition's capabilities from the project facts it was given", () => {
  const facts = runFacts() as ProjectCapabilityFacts;
  const projectFacts = facts as Parameters<typeof resolveRunCapabilities>[0];

  expect(resolveRunCapabilities(projectFacts)).toEqual({
    availability: { status: "enabled" },
    launch: { status: "enabled" },
  });
  // A catalogue that could not be refreshed locks the launch, but says nothing about whether the
  // Data Manager would run this definition — only the definition itself declares that.
  expect(resolveRunCapabilities(projectFacts, { content: "stale" })).toEqual({
    availability: { status: "enabled" },
    launch: {
      status: "disabled",
      reason:
        "This definition could not be refreshed, so running it cannot be established as safe.",
    },
  });
});

test("a disabled job explains itself through the definition the route addresses", () => {
  const items = catalogue({
    jobs: [
      job({ id: 1, disabled: true, disabled_reason: "No assets", version: "1.0.0" }),
      job({ id: 2, version: "2.0.0" }),
    ],
  });
  const jobItem = items.find((item) => item.kind === "job");

  expect(jobItem && runDefinitionUnavailability(jobItem, "1")).toBe("No assets");
  expect(jobItem && runDefinitionUnavailability(jobItem, "2")).toBeUndefined();
  expect(runDefinitionUnavailability(items[0], workflowId)).toBeUndefined();
});

test("a definition is placed by the catalogue that publishes its own type", () => {
  expect(runCatalogueOf("applications")).toBe("application");
  expect(runCatalogueOf("jobs")).toBe("job");
  expect(runCatalogueOf("workflows")).toBe("workflow");
});

test("a catalogue that fails does not decide what the other catalogues may show", () => {
  const readStates = {
    application: resolveSectionReadState(new Response(null, { status: 403 })),
    job: resolveSectionReadState(null),
    workflow: resolveSectionReadState(new Response(null, { status: 503 })),
  };

  expect(readStates).toEqual({
    application: { kind: "unavailable" },
    job: { kind: "available" },
    workflow: { kind: "recoverable", retryable: true },
  });
  // Both outcomes are the caller's to act on, so neither silences the other.
  expect(resolveSectionReadReport(Object.values(readStates))).toEqual({
    retryable: true,
    unavailable: true,
  });
  // Only the catalogue that could not be refreshed is stale, so the others stay launchable.
  expect(resolveRunFreshnessByType(readStates)).toEqual({
    application: "current",
    job: "current",
    workflow: "stale",
  });
});

test("Run state is owned by Run alone and never follows a project or section change", () => {
  const state = { search: "docking", types: ["job"] as const };

  expect(projectLinks.run(projectId, state)).toBe(
    `/projects/${projectId}/run?search=docking&type=job`,
  );
  // A definition link keeps the catalogue state it was opened from.
  expect(projectLinks.runDefinition(projectId, "jobs", "42", state)).toBe(
    `/projects/${projectId}/run/jobs/42?search=docking&type=job`,
  );
  // Another section of the same project starts from its own state, not from Run's.
  expect(projectLinks.results(projectId)).toBe(`/projects/${projectId}/results`);
  expect(projectLinks.files(projectId)).toBe(`/projects/${projectId}/files`);
  // Another project's Run starts empty; entering a project never carries Run state along.
  expect(projectLinks.run(otherProjectId)).toBe(`/projects/${otherProjectId}/run`);
});

/** The Run route one canonical href parses to, so a test can read the state it carries. */
const runRouteFor = (href: string) => {
  const parsed = parseProjectRoute(href);
  if (parsed.kind !== "valid") {
    throw new Error(`${href} must parse as a canonical route`);
  }
  const { route } = parsed;
  if (route.kind !== "run" && route.kind !== "run-definition") {
    throw new Error(`${href} must parse as a Run route`);
  }
  return route;
};

test("Run state resets to the route it is on, so no project inherits another's filters", () => {
  const filtered = runRouteFor(`/projects/${projectId}/run?search=docking&type=job`);
  const entered = runRouteFor(`/projects/${otherProjectId}/run`);
  const definition = runRouteFor(`/projects/${projectId}/run/jobs/42?search=docking&type=job`);

  expect(runCatalogueState(filtered)).toEqual({ search: "docking", types: ["job"] });
  expect(runCatalogueState(definition)).toEqual({ search: "docking", types: ["job"] });
  expect(runCatalogueState(entered)).toEqual({});
  // Filter state is never a request argument, so a reset changes what is shown and never what was
  // fetched: both projects issue the same project-constrained reads regardless of state.
  expect(runCatalogueRequests(filtered.projectId)).toEqual(runCatalogueRequests(projectId));
  expect(filterRunItems(catalogue(), runCatalogueState(entered))).toHaveLength(catalogue().length);
});

test("closing a definition returns to the catalogue state it was opened from", () => {
  const definition = runRouteFor(
    `/projects/${projectId}/run/workflows/${workflowId}?search=screen`,
  );

  expect(projectLinks.run(definition.projectId, runCatalogueState(definition))).toBe(
    `/projects/${projectId}/run?search=screen`,
  );
});

test("emptying the type filter clears it rather than leaving a state no URL can carry", () => {
  const items = catalogue();

  // A route carries only the types it narrows to, so "every type" and "no type at all" are the
  // same absent value in the link, in the parsed route, and in what the catalogue then shows.
  expect(projectLinks.run(projectId, { types: [] })).toBe(`/projects/${projectId}/run`);
  expect(runCatalogueState(runRouteFor(projectLinks.run(projectId, { types: [] })))).toEqual({});
  expect(filterRunItems(items, { types: [] })).toHaveLength(items.length);
});

test("a definition answers for the exact version the route addresses", () => {
  const items = catalogue({
    jobs: [
      job({ id: 1, disabled: true, disabled_reason: "No assets", version: "1.0.0" }),
      job({ id: 2, version: "2.0.0" }),
    ],
  });
  const jobItem = items.find((item) => item.kind === "job");
  const resolveFor = (username: string) =>
    jobItem &&
    resolveDefinitionCapabilities(
      runFacts({ username }) as Parameters<typeof resolveRunCapabilities>[0],
      jobItem,
      "current",
    );

  // A card links to one version at a time, and the modal that link opens refuses a disabled version
  // with that version's own reason rather than the newest version's.
  expect(resolveFor(editor)?.("1")).toEqual({
    availability: { status: "disabled", reason: "No assets" },
    launch: { status: "disabled", reason: "No assets" },
  });
  expect(resolveFor(editor)?.("2")).toEqual({
    availability: { status: "enabled" },
    launch: { status: "enabled" },
  });
  // A caller who also lacks authority is told what they lack first, but the version's own reason
  // is never replaced by it: both are stated, so nobody is left thinking the version is runnable.
  expect(resolveFor(observer)?.("1")).toEqual({
    availability: { status: "disabled", reason: "No assets" },
    launch: {
      status: "disabled",
      reason: "You must be a project editor or administrator to run work in this project.",
    },
  });
});

test("an execution that declares no project is counted by the read that returned it", () => {
  const workflowSelection: RunDefinitionSelection = { kind: "workflow", workflow: workflow() };
  const undeclared = instance({
    id: "instance-undeclared",
    job_version: "1.0.0",
    project_id: undefined,
  });
  const undeclaredWorkflow = runningWorkflow({
    id: "r-workflow-undeclared",
    project: { id: "", name: "" },
  });

  // The list request that returned it named the addressed project and nothing about the execution
  // disagrees, so a badge counts it; an execution that names another project is never counted.
  expect(
    badgeCount(
      selectedJob({ version: "1.0.0" }),
      runInstanceExecutions(answered, [undeclared], projectId),
    ),
  ).toEqual({ status: "counted", count: 1 });
  expect(
    badgeCount(
      selectedJob({ version: "1.0.0" }),
      runInstanceExecutions(
        answered,
        [instance({ job_version: "1.0.0", project_id: otherProjectId })],
        projectId,
      ),
    ),
  ).toEqual({ status: "counted", count: 0 });
  expect(
    badgeCount(
      workflowSelection,
      runRunningWorkflowExecutions(answered, [undeclaredWorkflow], projectId),
    ),
  ).toEqual({ status: "counted", count: 1 });
});

test.describe("Run cutover", () => {
  test("the legacy global Run route no longer exists", () => {
    expect(existsSync(path.join(process.cwd(), "src/pages/run.tsx"))).toBe(false);
    // The parser answers for the removed route rather than guessing a correction for it.
    for (const href of ["/run", `/run?project=${projectId}`]) {
      expect(parseProjectRoute(href)).toEqual({ kind: "not-found" });
    }
  });

  test("one page entry serves every URL beneath a project's Run section", () => {
    const projectPages = path.join(process.cwd(), "src/pages/projects/[projectId]");

    // A definition route and a URL Run cannot address must reach the same section, so a mistyped
    // path is answered beneath the project rather than by the application's own not-found. Run
    // itself is the only other Run entry: nothing else may claim part of the section's URL space.
    expect(readdirSync(projectPages).filter((entry) => entry.startsWith("run"))).toEqual([
      "run",
      "run.tsx",
    ]);
    expect(readdirSync(path.join(projectPages, "run"))).toEqual(["[...definition].tsx"]);
  });

  test("no handwritten module composes a Run route or reads a selected project", () => {
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

    // Composing the legacy Run path, rather than calling the family builder, would be a second
    // owner of the route.
    expect(handwrittenMatching(/["'`]\/run["'`]/u)).toEqual([]);
    // The Run family reads the project from the URL alone.
    for (const sourceFile of [
      "projects/ProjectRun.tsx",
      "projects/ProjectRunDefinition.tsx",
      "projects/runFacts.ts",
      "projects/runCapabilities.ts",
      "projects/useProjectRun.ts",
      "projects/useRunCommands.ts",
      "components/runCards/ExecutionCountBadge.tsx",
      "components/runCards/ApplicationCard/ApplicationCard.tsx",
      "components/runCards/ApplicationCard/ApplicationModal.tsx",
      "components/runCards/JobCard/JobCard.tsx",
      "components/runCards/JobCard/JobModal.tsx",
      "components/runCards/WorkflowCard/WorkflowCard.tsx",
      "components/runCards/WorkflowCard/WorkflowModal.tsx",
    ]) {
      expect(readFileSync(path.join(root, sourceFile), "utf8")).not.toMatch(
        /useCurrentProject|useIsUserAdminOrEditorOfCurrentProject|useProjectFromId/u,
      );
    }
  });

  test("one implementation of a definition's executions survives, and nothing names the other", () => {
    const typescriptSource = /\.tsx?$/u;
    const generated = /(?:^|\/)generated\//u;
    const removedList =
      /InstancesList|RunningWorkflowsList|runDefinitionInstances|runDefinitionRunningWorkflows/u;
    const root = path.join(process.cwd(), "src");

    // The Run section listed a definition's executions a second time, in a card that could neither
    // search, refresh, nor act on them. The components that drew those lists and the facts that
    // selected the executions for them are gone rather than merely unused.
    for (const removed of ["InstancesList", "RunningWorkflowsList"]) {
      expect(existsSync(path.join(root, `components/runCards/${removed}.tsx`))).toBe(false);
    }
    // No handwritten module names either of them, or the facts that fed them, so a second list
    // cannot come back unnoticed beside the one badge that now points at the real one.
    const naming = readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
      .map((entry) =>
        path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
      )
      .filter((file) => !generated.test(file))
      .filter((file) => removedList.test(readFileSync(path.join(root, file), "utf8")));
    expect(naming).toEqual([]);
  });
});

test("useRunCommands is the only owner of Run mutations and their invalidation", () => {
  const root = path.join(process.cwd(), "src");

  // Every component that launches work routes it through the one command owner, so no modal
  // mutates or invalidates on its own.
  for (const modal of [
    "components/runCards/ApplicationCard/ApplicationModal.tsx",
    "components/runCards/JobCard/JobModal.tsx",
    "components/runCards/WorkflowCard/WorkflowModal.tsx",
  ]) {
    const source = readFileSync(path.join(root, modal), "utf8");
    expect(source).toContain("useRunCommands");
    expect(source).not.toMatch(/useQueryClient|invalidateQueries/u);
    expect(source).not.toMatch(/useCreateInstance|useRunWorkflow/u);
  }

  // The owner's own collection keys are all built from a project's list request, so a launch can
  // never invalidate an unprojected — and therefore cross-project — collection.
  const owner = readFileSync(path.join(root, "projects/useRunCommands.ts"), "utf8");
  for (const collectionKey of ["getGetInstancesQueryKey", "getGetRunningWorkflowsQueryKey"]) {
    expect(owner).toContain(`${collectionKey}(runCatalogueRequests(projectId)`);
    expect(owner).not.toMatch(new RegExp(String.raw`${collectionKey}\(\s*\)`, "u"));
  }
  // A launch always names the project it was made in.
  expect(owner).toContain("project_id: projectId");
});
