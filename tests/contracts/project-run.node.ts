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

import { CenterLoader } from "../../src/components/CenterLoader";
import { InstancesList } from "../../src/components/runCards/InstancesList";
import { RunningWorkflowsList } from "../../src/components/runCards/RunningWorkflowsList";
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
  filterRunItems,
  findRunDefinition,
  resolveRunFreshnessByType,
  runCatalogueOf,
  runCatalogueRequests,
  runDefinitionInstances,
  runDefinitionRunningWorkflows,
  runDefinitionUnavailability,
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

test("existing executions on a card belong to the project the catalogue is addressed in", () => {
  const [workflowItem, applicationItem, jobItem] = catalogue();
  const instances = [
    instance(),
    instance({ id: "instance-newer", launched: "2026-01-03T03:00:00Z" }),
    instance({ id: "instance-foreign", project_id: otherProjectId }),
    instance({ id: "instance-other-job", job_job: "another-job" }),
  ];
  const runningWorkflows = [
    runningWorkflow(),
    runningWorkflow({ id: "r-workflow-foreign", project: { id: otherProjectId, name: "Partner" } }),
    runningWorkflow({
      id: "r-workflow-other",
      workflow: { id: "workflow-other", name: "other", version: "1.0.0" },
    }),
  ];

  // A response that ignored the project argument still cannot put another project's work on a card.
  expect(runDefinitionInstances(jobItem, instances, projectId).map(({ id }) => id)).toEqual([
    "instance-newer",
    instance().id,
  ]);
  expect(runDefinitionInstances(applicationItem, instances, projectId)).toEqual([]);
  expect(
    runDefinitionRunningWorkflows(workflowItem, runningWorkflows, projectId).map(({ id }) => id),
  ).toEqual([runningWorkflow().id]);
  // A workflow definition has no instances and an application has no running workflows.
  expect(runDefinitionRunningWorkflows(jobItem, runningWorkflows, projectId)).toEqual([]);
  expect(
    runDefinitionInstances(
      catalogue({ applications: [application({ application_id: "acceptance-application" })] })[1],
      instances,
      projectId,
    ).map(({ id }) => id),
  ).toEqual(["instance-newer", instance().id, "instance-other-job"]);
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

test("a card and a modal answer alike about the version each of them addresses", () => {
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

  // The card shows one version at a time and links to that version's own route, so it must refuse
  // a disabled version with the same reason the modal that addresses it gives.
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

/** What one list component returns, so the branch it took can be read without a DOM. */
const rendered = <TProps>(list: (props: TProps) => unknown, props: TProps) => list(props);

test("a card waits for the collection it lists before saying it has none", () => {
  const loader = { type: CenterLoader };

  // Each list is given its own collection's read state, so a card that lists instances is never
  // held up by the running-workflow read, and neither claims emptiness before its read answers.
  expect(rendered(InstancesList, { instances: [], isLoading: true })).toMatchObject(loader);
  expect(rendered(RunningWorkflowsList, { isLoading: true, runningWorkflows: [] })).toMatchObject(
    loader,
  );
  expect(rendered(InstancesList, { instances: [], isLoading: false })).not.toMatchObject(loader);
  expect(
    rendered(RunningWorkflowsList, { isLoading: false, runningWorkflows: [] }),
  ).not.toMatchObject(loader);
});

test("an execution that declares no project belongs to the read that returned it", () => {
  const [workflowItem, , jobItem] = catalogue();
  const undeclared = instance({ id: "instance-undeclared", project_id: undefined });
  const undeclaredWorkflow = runningWorkflow({
    id: "r-workflow-undeclared",
    project: { id: "", name: "" },
  });

  // The list request that returned it named the addressed project and nothing about the execution
  // disagrees, so it belongs there; an execution that names another project never does.
  expect(runDefinitionInstances(jobItem, [undeclared], projectId).map(({ id }) => id)).toEqual([
    undeclared.id,
  ]);
  expect(
    runDefinitionInstances(jobItem, [instance({ project_id: otherProjectId })], projectId),
  ).toEqual([]);
  expect(
    runDefinitionRunningWorkflows(workflowItem, [undeclaredWorkflow], projectId).map(
      ({ id }) => id,
    ),
  ).toEqual([undeclaredWorkflow.id]);
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
      "components/runCards/ApplicationCard/ApplicationCard.tsx",
      "components/runCards/ApplicationCard/ApplicationModal.tsx",
      "components/runCards/JobCard/JobCard.tsx",
      "components/runCards/JobCard/JobModal.tsx",
      "components/runCards/WorkflowCard/WorkflowCard.tsx",
      "components/runCards/WorkflowCard/WorkflowModal.tsx",
      "components/runCards/InstancesList.tsx",
      "components/runCards/RunningWorkflowsList.tsx",
    ]) {
      expect(readFileSync(path.join(root, sourceFile), "utf8")).not.toMatch(
        /useCurrentProject|useIsUserAdminOrEditorOfCurrentProject|useProjectFromId/u,
      );
    }
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
