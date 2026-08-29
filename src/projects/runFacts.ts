import {
  type ApplicationSummary,
  type InstanceSummary,
  type JobSummary,
  type RunningWorkflowSummary,
  type WorkflowSummary,
} from "@/api/data-manager";

import semver from "semver";

import { search } from "../utils/app/searches";
import {
  definitionTerms,
  matchesDefinition,
  type ResultItem,
  type ResultsDefinitionTarget,
  selectProjectResults,
} from "./resultFacts";
import {
  isDefinitionVersion,
  type RunDefinitionType,
  type RunFilterType,
  showsType,
  type UncheckedDefinitionFilter,
} from "./routes";
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
 * Ends a sentence the Data Manager wrote, so what it says can be read beside sentences of our own.
 * The reason and the remedy arrive as free text and neither is promised to be punctuated, so a
 * sentence that already ends is left as it stands rather than stopped twice.
 */
const asSentence = (text: string): string => {
  const trimmed = text.trim();

  return [".", "!", "?"].some((stop) => trimmed.endsWith(stop)) ? trimmed : `${trimmed}.`;
};

/**
 * Why a definition cannot be run whatever authority the caller holds. The Data Manager disables
 * individual jobs, and says why, so that reason is the definition's own rather than the project's.
 *
 * Where it also offers a remedy — which it does for the reasons a caller can actually do something
 * about, a missing licence being the documented case — the remedy is stated with the reason, so the
 * caller is told the fix that was offered alongside the problem rather than the problem alone.
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
  const reason = job.disabled_reason?.trim()
    ? asSentence(job.disabled_reason)
    : "This job is disabled, so it cannot be run.";

  return job.disabled_remedy?.trim() ? `${reason} ${asSentence(job.disabled_remedy)}` : reason;
};

/**
 * The definition one card is currently offering, as the card itself holds it. A job card offers one
 * version at a time and the caller chooses which, so the version selected on the card is part of
 * what the card is offering; an application card and a workflow card each offer the whole
 * definition, which is why neither carries one.
 */
export type RunDefinitionSelection =
  | { kind: "application"; application: ApplicationSummary }
  | { kind: "job"; job: JobSummary }
  | { kind: "workflow"; workflow: WorkflowSummary };

/**
 * What a card's execution badge counts and where following it lands. Both come from one value, so a
 * badge and the list it links to are decided by the same selection and cannot name two different
 * definitions.
 */
export type RunDefinitionExecutionFilter = {
  /** The Results filter a badge links to, as a URL carries it. */
  filter: UncheckedDefinitionFilter;
  /** What the definition is called, by the rule the Results chip names the same filter by. */
  name: string;
  /** The identity a count is decided on, as the Results matching rule compares it. */
  target: ResultsDefinitionTarget;
};

/**
 * The filter one card's badge counts and links to.
 *
 * A job card counts and links to the version selected on it, so the count and the destination can
 * never disagree about which version they mean. A workflow card counts and links to every running
 * workflow of its definition, and an application card to every instance of its application, because
 * each of those cards represents the whole definition rather than one version of it.
 *
 * The URL's identifier is per-version for a job, so it is not the identity a count can be decided
 * on: that is the version-agnostic one the Results rule compares, taken from the same catalogue
 * entry the link is built from.
 */
export const runDefinitionExecutionFilter = (
  selection: RunDefinitionSelection,
): RunDefinitionExecutionFilter => {
  switch (selection.kind) {
    case "application": {
      const { application } = selection;
      return {
        filter: { definitionType: "applications", definitionId: application.application_id },
        name: definitionTerms.applications.name(application),
        target: { definitionType: "applications", applicationId: application.application_id },
      };
    }
    case "job": {
      const { job } = selection;
      // A version the Data Manager published that no URL could carry names no version at all, so
      // the card counts and links to every version of the job rather than throwing the catalogue
      // away over one — the same treatment a version that cannot be ordered already gets. The
      // count and the link drop it together, so the two still mean the same thing.
      const narrowed = isDefinitionVersion(job.version) ? { version: job.version } : {};
      return {
        filter: { definitionType: "jobs", definitionId: String(job.id), ...narrowed },
        name: definitionTerms.jobs.name(job),
        target: { definitionType: "jobs", collection: job.collection, job: job.job, ...narrowed },
      };
    }
    case "workflow": {
      const { workflow } = selection;
      return {
        filter: { definitionType: "workflows", definitionId: workflow.id },
        name: definitionTerms.workflows.name(workflow),
        target: { definitionType: "workflows", name: workflow.name },
      };
    }
  }
};

/**
 * One collection of the addressed project's executions, as a badge that counts it sees it. A read
 * still outstanding and a read that failed are distinct outcomes and neither is a count: a badge
 * that showed nothing for either would report a project's work as never having run.
 *
 * A collection that failed to be read is not counted even where content from an earlier read
 * survives. A badge is a bare number with nowhere to say that it may be out of date, and the
 * section states that failure and offers the retry for it, so the number is withheld rather than
 * presented as this project's answer.
 */
export type RunExecutions =
  | { status: "pending" }
  | { status: "read"; results: readonly ResultItem[] }
  | { status: "unreadable" };

/** What a card's badge may state about the definition it counts. */
export type RunExecutionCount =
  | { status: "counted"; count: number }
  | { status: "pending" }
  | { status: "unreadable" };

type RunExecutionRead = { isLoading: boolean; readState: SectionReadState };

const resolveRunExecutions = (
  { isLoading, readState }: RunExecutionRead,
  results: readonly ResultItem[],
): RunExecutions => {
  if (isLoading) {
    return { status: "pending" };
  }
  return readState.kind === "available" ? { status: "read", results } : { status: "unreadable" };
};

/**
 * The addressed project's instances as the badges that count them see them. They are the results
 * the Results section itself would list, so ownership is decided exactly once and a badge can never
 * count work the project in the URL does not own.
 */
export const runInstanceExecutions = (
  read: RunExecutionRead,
  instances: readonly InstanceSummary[],
  projectId: string,
): RunExecutions =>
  resolveRunExecutions(
    read,
    selectProjectResults({ instances, projectId, tasks: [], workflows: [] }),
  );

/** The same, for the addressed project's running workflows. */
export const runRunningWorkflowExecutions = (
  read: RunExecutionRead,
  runningWorkflows: readonly RunningWorkflowSummary[],
  projectId: string,
): RunExecutions =>
  resolveRunExecutions(
    read,
    selectProjectResults({ instances: [], projectId, tasks: [], workflows: runningWorkflows }),
  );

/**
 * How many executions of one definition the addressed project has. It is decided by the Results
 * matching rule itself rather than by a second rule of Run's own, so a badge and the filtered list
 * it links to cannot drift apart, and it needs no read of its own: the composition already holds
 * every execution it counts.
 */
export const countRunDefinitionExecutions = (
  executions: RunExecutions,
  target: ResultsDefinitionTarget,
): RunExecutionCount =>
  executions.status === "read"
    ? {
        status: "counted",
        count: executions.results.filter((item) => matchesDefinition(item, target)).length,
      }
    : executions;

/**
 * What a badge states about the definition it counts: the mark it displays, and the words it is
 * announced by. Both outcomes of every state are built here, so a component picks no mark of its
 * own and what a caller reads and what a screen reader hears cannot drift apart.
 *
 * Every outcome has a mark, because every outcome has something to say: the number where a read
 * answered — zero included, which is a fact a read established — and a mark of its own for a read
 * still outstanding and a read that failed, so neither is ever displayed as a count.
 */
export const runExecutionCountStatement = (
  count: RunExecutionCount,
  name: string,
): { description: string; text: string } => {
  switch (count.status) {
    case "counted": {
      const executions = `${count.count} ${count.count === 1 ? "execution" : "executions"}`;
      return { description: `${executions} of ${name}`, text: String(count.count) };
    }
    case "pending":
      return { description: `Counting executions of ${name}`, text: "…" };
    case "unreadable":
      return { description: `Executions of ${name} could not be read`, text: "!" };
  }
};
