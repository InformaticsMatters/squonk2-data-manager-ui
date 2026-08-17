import {
  type ApplicationSummary,
  type InstanceSummary,
  type JobSummary,
  type RunningWorkflowSummary,
  type WorkflowSummary,
} from "@/api/data-manager";

import semver from "semver";

import { search } from "../utils/app/searches";
import { definitionTerms, instanceOwner, ownedBy, runningWorkflowOwner } from "./resultFacts";
import { type RunDefinitionType, type RunFilterType, showsType } from "./routes";
import { resolveSectionFreshnessByKey, type SectionReadState } from "./sectionReads";

/**
 * The generated list arguments every Run read uses. The Data Manager constrains jobs, existing
 * instances, and running workflows by project, so the project in the URL is a required argument of
 * each of those reads and no Run read can be issued against a remembered selection. Applications
 * and workflow definitions are catalogues the Data Manager does not scope by project, so they take
 * no project argument at all rather than a guessed one.
 */
export const runCatalogueRequests = (projectId: string) =>
  ({
    instances: { project_id: projectId },
    jobs: { project_id: projectId },
    runningWorkflows: { project_id: projectId },
  }) as const;

/** How each Run collection's own last read answered, keyed by the definitions it carries. */
export type RunReadStates = Record<RunFilterType, SectionReadState>;

/** Each catalogue's content is only as fresh as its own last read. */
export const resolveRunFreshnessByType = (
  states: RunReadStates,
): Record<RunFilterType, "current" | "stale"> => resolveSectionFreshnessByKey(states);

type RunDefinitionItemOf<TKind extends RunFilterType, TData> = {
  /** The canonical definition route segment this item is addressed through. */
  definitionType: RunDefinitionType;
  /** The identity the definition's own canonical route carries. */
  id: string;
  kind: TKind;
  /** What the card shows without opening the definition. */
  data: TData;
  /** The heading a card and its modal share, so both name the same definition. */
  title: string;
  subtitle: string;
};

export type RunDefinitionItem =
  | (RunDefinitionItemOf<"application", ApplicationSummary> & { definitionType: "applications" })
  /** Every version of one job, most recent first; the card offers them and addresses one. */
  | (RunDefinitionItemOf<"job", JobSummary[]> & { definitionType: "jobs" })
  | (RunDefinitionItemOf<"workflow", WorkflowSummary> & { definitionType: "workflows" });

/**
 * Newest version first. A version the Data Manager did not publish as semver is still ordered,
 * because a job whose version cannot be parsed must remain offered rather than throw the catalogue
 * away.
 */
const compareVersions = (left: string, right: string) =>
  semver.valid(left) && semver.valid(right)
    ? semver.rcompare(left, right)
    : right.localeCompare(left);

export type RunCatalogueInput = {
  applications: readonly ApplicationSummary[];
  jobs: readonly JobSummary[];
  workflows: readonly WorkflowSummary[];
};

/**
 * Every definition the catalogue offers. Jobs are grouped by their collection and name so one card
 * offers every version of one job, and a job another version replaces is dropped rather than
 * offered twice. Workflow definitions are grouped by name for the same reason.
 */
export const selectRunCatalogue = ({
  applications,
  jobs,
  workflows,
}: RunCatalogueInput): RunDefinitionItem[] => {
  const applicationItems: RunDefinitionItem[] = applications.map((application) => ({
    definitionType: "applications",
    id: application.application_id,
    kind: "application",
    data: application,
    title: definitionTerms.applications.name(application),
    subtitle: application.group ?? "",
  }));

  const jobGroups = new Map<string, JobSummary[]>();
  for (const job of jobs.filter(({ replaced_by }) => !replaced_by)) {
    const key = `${job.collection}+${job.job}`;
    jobGroups.set(key, [...(jobGroups.get(key) ?? []), job]);
  }
  const jobItems: RunDefinitionItem[] = [...jobGroups.values()]
    .map((versions) =>
      versions.toSorted((left, right) => compareVersions(left.version, right.version)),
    )
    .map((versions) => ({
      definitionType: "jobs",
      id: String(versions[0].id),
      kind: "job",
      data: versions,
      title: definitionTerms.jobs.name(versions[0]),
      subtitle: versions[0].name,
    }));

  const workflowGroups = new Map<string, WorkflowSummary>();
  for (const workflow of workflows) {
    if (!workflowGroups.has(workflow.name)) {
      workflowGroups.set(workflow.name, workflow);
    }
  }
  const workflowItems: RunDefinitionItem[] = [...workflowGroups.values()].map((workflow) => ({
    definitionType: "workflows",
    id: workflow.id,
    kind: "workflow",
    data: workflow,
    title: definitionTerms.workflows.name(workflow),
    subtitle: workflow.name,
  }));

  return [...workflowItems, ...applicationItems, ...jobItems];
};

const matchesSearch = (item: RunDefinitionItem, searchValue: string) => {
  switch (item.kind) {
    case "application":
      return search([item.data.kind, item.data.group], searchValue);
    case "job": {
      const [job] = item.data;
      return search([job.keywords, job.category, job.name, job.job, job.description], searchValue);
    }
    case "workflow":
      return search([item.data.workflow_name, item.data.workflow_description], searchValue);
  }
};

/**
 * Applies the Run section's own route state to the catalogue. The state comes from the section's
 * query allowlist alone, so nothing outside Run can change what is fetched or shown.
 */
export const filterRunItems = (
  items: readonly RunDefinitionItem[],
  { search: searchValue = "", types }: { search?: string; types?: readonly RunFilterType[] } = {},
): RunDefinitionItem[] =>
  items
    .filter((item) => showsType(types, item.kind))
    .filter((item) => matchesSearch(item, searchValue));

const definitionCatalogues = {
  applications: "application",
  jobs: "job",
  workflows: "workflow",
} as const satisfies Record<RunDefinitionType, RunFilterType>;

/** The catalogue that publishes one definition type, and therefore answers for it alone. */
export const runCatalogueOf = (definitionType: RunDefinitionType): RunFilterType =>
  definitionCatalogues[definitionType];

/**
 * The one definition a canonical definition route addresses, or `undefined` when the catalogue
 * answered and does not contain it. Identity is compared as the route carries it, so a job version
 * a card offers is addressable even though the card is headed by the newest one.
 */
export const findRunDefinition = (
  items: readonly RunDefinitionItem[],
  definitionType: RunDefinitionType,
  definitionId: string,
): RunDefinitionItem | undefined =>
  items.find(
    (item) =>
      item.definitionType === definitionType &&
      (item.id === definitionId ||
        (item.kind === "job" && item.data.some((job) => String(job.id) === definitionId))),
  );

/**
 * Why a definition cannot be run whatever authority the caller holds. The Data Manager disables
 * individual jobs, and says why, so that reason is the definition's own rather than the project's.
 */
export const runDefinitionUnavailability = (
  item: RunDefinitionItem,
  definitionId: string,
): string | undefined => {
  if (item.kind !== "job") {
    return undefined;
  }
  const job = item.data.find((candidate) => String(candidate.id) === definitionId) ?? item.data[0];
  if (!job.disabled) {
    return undefined;
  }
  return job.disabled_reason ?? "This job is disabled, so it cannot be run.";
};

/** Whether one existing instance came from the definition a card is offering. */
const instantiates = (item: RunDefinitionItem, instance: InstanceSummary): boolean => {
  switch (item.kind) {
    case "application":
      return instance.application_id === item.data.application_id;
    case "job":
      return item.data.some(
        (job) => instance.job_collection === job.collection && instance.job_job === job.job,
      );
    case "workflow":
      return false;
  }
};

/**
 * The existing instances of one definition inside the addressed project. Only instances the
 * project owns are matched, on the same terms Results matches them, so a response that declared
 * another project still cannot put that project's work on a card.
 */
export const runDefinitionInstances = (
  item: RunDefinitionItem,
  instances: readonly InstanceSummary[],
  projectId: string,
): InstanceSummary[] =>
  instances
    .filter((instance) => ownedBy(instanceOwner(instance), projectId))
    .filter((instance) => instantiates(item, instance))
    .toSorted((left, right) => right.launched.localeCompare(left.launched));

/** The running workflows of one workflow definition inside the addressed project. */
export const runDefinitionRunningWorkflows = (
  item: RunDefinitionItem,
  runningWorkflows: readonly RunningWorkflowSummary[],
  projectId: string,
): RunningWorkflowSummary[] =>
  item.kind === "workflow"
    ? runningWorkflows
        .filter((workflow) => ownedBy(runningWorkflowOwner(workflow), projectId))
        .filter((workflow) => workflow.workflow.id === item.data.id)
        .toSorted((left, right) => right.started.localeCompare(left.started))
    : [];
