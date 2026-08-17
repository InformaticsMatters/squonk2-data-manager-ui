import {
  type ApplicationSummary,
  type InstanceSummary,
  type JobSummary,
  type RunningWorkflowSummary,
  type TaskSummary,
  type WorkflowSummary,
} from "@/api/data-manager";

import { search } from "../utils/app/searches";
import { type ResultFilterType, showsType, type UncheckedDefinitionFilter } from "./routes";
import {
  resolveSectionFreshness,
  resolveSectionFreshnessByKey,
  resolveSectionReadReport,
  type SectionReadReport,
  type SectionReadState,
} from "./sectionReads";

/** Only these task purposes are results of work a project user asked for. */
const listedTaskPurposes = new Set(["DATASET", "FILE"]);

/**
 * The generated list arguments every Results read uses. The project in the URL is a required
 * argument of each one, so no Results read can ever be issued without a project or against
 * whichever project a selection hook last remembered.
 */
export const resultListRequests = (projectId: string) =>
  ({
    instances: { project_id: projectId },
    tasks: { exclude_purpose: "INSTANCE.PROJECT", project_id: projectId },
    workflows: { project_id: projectId },
  }) as const;

type ResultItemOf<TKind extends ResultFilterType, TData> = {
  data: TData;
  id: string;
  kind: TKind;
  /** The project this result belongs to, as the result itself accounts for it. */
  owningProjectId: string;
  time: string;
};

export type ResultItem =
  | ResultItemOf<"instance", InstanceSummary>
  | ResultItemOf<"task", TaskSummary>
  | ResultItemOf<"workflow", RunningWorkflowSummary>;

/**
 * The project a result belongs to, taken from the result itself wherever the generated resource
 * declares one. A task declares no project of its own, so the constrained list request that
 * returned it is its only ownership fact; anything that does declare one is believed over the
 * request, which is what lets a cross-project row be recognised rather than displayed.
 */
const declaredOwner = (projectId: string | undefined) =>
  projectId === undefined || projectId === "" ? undefined : projectId;

export const instanceOwner = (instance: Pick<InstanceSummary, "project_id">) =>
  declaredOwner(instance.project_id);

export const runningWorkflowOwner = (workflow: Pick<RunningWorkflowSummary, "project">) =>
  declaredOwner(workflow.project.id);

/**
 * A task declares no project at all, whether it was listed or addressed directly. It therefore
 * never contradicts the project-constrained collection that placed it, and reading one can never
 * discover an owner the collection did not already establish.
 */
export const taskOwner = (): undefined => undefined;

/**
 * Whether an execution belongs to the addressed project. An execution that declares an owner is
 * believed over the request that returned it, which is what lets a cross-project row be recognised
 * rather than displayed; one that declares none has no ownership fact but the constrained request
 * it came back from, so it belongs to the project that request named. Run and Results both list
 * the same executions, so both decide this the same way.
 */
export const ownedBy = (declaredOwner: string | undefined, projectId: string) =>
  declaredOwner === undefined || declaredOwner === projectId;

export type ProjectResultsInput = {
  instances: readonly InstanceSummary[];
  projectId: string;
  tasks: readonly TaskSummary[];
  workflows: readonly RunningWorkflowSummary[];
};

/**
 * Every result the addressed project owns, ordered most recent first. A result whose own resource
 * names another project is dropped rather than displayed, so a response that ignored the project
 * argument still cannot put another project's work on this screen.
 */
export const selectProjectResults = ({
  instances,
  projectId,
  tasks,
  workflows,
}: ProjectResultsInput): ResultItem[] => {
  const instanceItems: ResultItem[] = instances
    .filter((instance) => ownedBy(instanceOwner(instance), projectId))
    .map((instance) => ({
      kind: "instance",
      id: instance.id,
      owningProjectId: instanceOwner(instance) ?? projectId,
      time: instance.launched,
      data: instance,
    }));

  const taskItems: ResultItem[] = tasks
    .filter((task) => listedTaskPurposes.has(task.purpose))
    .map((task) => ({
      kind: "task",
      id: task.id,
      owningProjectId: projectId,
      time: task.created,
      data: task,
    }));

  const workflowItems: ResultItem[] = workflows
    .filter((workflow) => ownedBy(runningWorkflowOwner(workflow), projectId))
    .map((workflow) => ({
      kind: "workflow",
      id: workflow.id,
      owningProjectId: runningWorkflowOwner(workflow) ?? projectId,
      time: workflow.started,
      data: workflow,
    }));

  return [...instanceItems, ...taskItems, ...workflowItems].toSorted((left, right) =>
    right.time.localeCompare(left.time),
  );
};

/**
 * The definition a Results list is narrowed to, as the definition's own catalogue accounts for it
 * rather than as a URL names it. A URL carries a per-version identifier, and the version-agnostic
 * case has to stay expressible, so identity is the version-agnostic one every version of a
 * definition shares: a job's collection and name rather than its numeric identifier, and a workflow
 * definition's name — the same identity the Run catalogue groups one card per.
 */
export type ResultsDefinitionIdentity =
  | { definitionType: "applications"; applicationId: string }
  | { definitionType: "jobs"; collection: string; job: string }
  | { definitionType: "workflows"; name: string };

/**
 * That identity with the version a URL narrowed to, if any. An absent version is every version of
 * the definition; a present one is that version alone.
 */
export type ResultsDefinitionTarget = ResultsDefinitionIdentity & { version?: string };

/**
 * Whether one result is an execution of the definition a filter names. This is the whole matching
 * rule and it is a pure fact of the two, so anything else that has to agree about what a definition
 * has executed — a Run card's count of the same definition, once it has one — decides it here
 * rather than growing a second rule that could drift from this one.
 *
 * Exactly one kind of result can match each definition type, because the others carry no identity
 * that could match: a task is a dataset or file purpose and names no job, application or workflow
 * at all; a running workflow names no job or application; and an instance names no workflow
 * definition. None of those is a near miss to be resolved — there is simply nothing to compare.
 */
export const matchesDefinition = (item: ResultItem, target: ResultsDefinitionTarget): boolean => {
  switch (target.definitionType) {
    // An application version is not part of an application's identity here: a card offers the
    // application, and the filter it links to means every instance of it.
    case "applications":
      return item.kind === "instance" && item.data.application_id === target.applicationId;
    case "jobs":
      return (
        item.kind === "instance" &&
        item.data.job_collection === target.collection &&
        item.data.job_job === target.job &&
        (target.version === undefined || item.data.job_version === target.version)
      );
    case "workflows":
      return (
        item.kind === "workflow" &&
        item.data.workflow.name === target.name &&
        (target.version === undefined || item.data.workflow.version === target.version)
      );
  }
};

/**
 * The catalogue that publishes one definition type. Only the catalogue the filter names is ever
 * read, so the other two are empty rather than fetched.
 */
export type ResultsDefinitionCatalogue = {
  applications: readonly ApplicationSummary[];
  jobs: readonly JobSummary[];
  workflows: readonly WorkflowSummary[];
};

/**
 * How each definition type is spoken about on screen: what the kind itself is called, and what one
 * entry of its catalogue is called. Both come from one place, keyed by the type a route already
 * spells, so the chip that states a filter names a definition exactly as the Run card that links to
 * the filter does and neither can be renamed without the other following.
 */
export const definitionTerms = {
  applications: {
    label: "Application",
    name: (application: Pick<ApplicationSummary, "kind">) => application.kind,
  },
  jobs: { label: "Job", name: (job: Pick<JobSummary, "job">) => job.job },
  workflows: {
    label: "Workflow",
    name: (workflow: Pick<WorkflowSummary, "name" | "workflow_name">) =>
      workflow.workflow_name ?? workflow.name,
  },
} as const;

/**
 * The catalogue entry a URL names, or `undefined` when the catalogue does not contain it. The URL's
 * identifier is per-version for jobs and workflows, so the catalogue is the only place both the
 * identity every version shares and the definition's current name can come from.
 */
const findDefinitionEntry = (
  { definitionId, definitionType }: UncheckedDefinitionFilter,
  catalogue: ResultsDefinitionCatalogue,
): { identity: ResultsDefinitionIdentity; name: string } | undefined => {
  switch (definitionType) {
    case "applications": {
      const application = catalogue.applications.find(
        (candidate) => candidate.application_id === definitionId,
      );
      return (
        application && {
          identity: { definitionType, applicationId: application.application_id },
          name: definitionTerms.applications.name(application),
        }
      );
    }
    case "jobs": {
      const job = catalogue.jobs.find((candidate) => String(candidate.id) === definitionId);
      return (
        job && {
          identity: { definitionType, collection: job.collection, job: job.job },
          name: definitionTerms.jobs.name(job),
        }
      );
    }
    case "workflows": {
      const workflow = catalogue.workflows.find((candidate) => candidate.id === definitionId);
      return (
        workflow && {
          identity: { definitionType, name: workflow.name },
          name: definitionTerms.workflows.name(workflow),
        }
      );
    }
  }
};

/**
 * The definition a list narrows to, and how fresh the catalogue that named it is. It is the one
 * resolution a caller can be told about, because it is the only one that named anything.
 */
export type ResolvedResultsDefinition = {
  status: "resolved";
  content: "current" | "stale";
  /**
   * What the catalogue calls the definition now. It is never the URL's identifier, which names one
   * version and says nothing a caller could read, and never a matched result's own name, which is
   * unavailable in exactly the zero-match case where the caller needs it most.
   */
  name: string;
  target: ResultsDefinitionTarget;
};

/**
 * What the section knows about the definition its URL names. Only a resolved definition narrows the
 * list; every other outcome leaves the whole list on screen, because a caller who followed a stale
 * or unreadable link is better served by a usable page than by an empty one they cannot explain.
 */
export type ResultsDefinitionResolution =
  | ResolvedResultsDefinition
  /** The catalogue answered and does not contain the identifier the URL names. */
  | { status: "not-found" }
  /** The catalogue read is outstanding, so the list cannot yet be narrowed or shown unnarrowed. */
  | { status: "pending" }
  /** The URL names no definition, so nothing was read and nothing is narrowed. */
  | { status: "unfiltered" }
  /** The catalogue's content is gone, so what it would have said about the definition is unknown. */
  | { status: "unreadable" };

/**
 * How a resolved filter is stated on screen: the kind of definition, what the catalogue calls it,
 * and the version when the URL narrowed to one. The chip and the empty state both say it, so they
 * are built from one rule and cannot name the same filter two different ways.
 */
export const resultsDefinitionLabel = ({ name, target }: ResolvedResultsDefinition) =>
  `${definitionTerms[target.definitionType].label}: ${name}${
    target.version === undefined ? "" : ` (${target.version})`
  }`;

/**
 * What the chip states about the filter a URL carries, or `undefined` when there is nothing to
 * state: no filter at all, or a catalogue read still outstanding.
 *
 * A filter the catalogue could not name is still stated and still clearable. The definition filter
 * displaces the type filter, and the type filter cannot come back while the URL still carries a
 * definition, so a caller whose definition failed to resolve would otherwise be left with neither
 * control and no way back to the whole list but the URL. What such a chip states is the kind of
 * filter that is active, which the URL does name — never a definition name, which only an
 * answering catalogue can supply.
 */
export const resultsFilterStatement = (
  definition: UncheckedDefinitionFilter | undefined,
  resolution: ResultsDefinitionResolution,
): string | undefined => {
  if (definition === undefined || resolution.status === "pending") {
    return undefined;
  }
  return resolution.status === "resolved"
    ? resultsDefinitionLabel(resolution)
    : `${definitionTerms[definition.definitionType].label} filter`;
};

/**
 * How the definition catalogue's own read answers for the definition a URL names. The read joins
 * the section's read machinery on the same terms as the results collections: it answers for itself,
 * its content is only as fresh as its own last read, and content it could not refresh is still
 * worth resolving against rather than thrown away.
 */
export const resolveResultsDefinition = ({
  catalogue,
  definition,
  isLoading,
  readState,
}: {
  catalogue: ResultsDefinitionCatalogue;
  definition: UncheckedDefinitionFilter | undefined;
  isLoading: boolean;
  readState: SectionReadState;
}): ResultsDefinitionResolution => {
  if (definition === undefined) {
    return { status: "unfiltered" };
  }
  if (isLoading) {
    return { status: "pending" };
  }
  const entry = findDefinitionEntry(definition, catalogue);
  if (entry !== undefined) {
    // Content that could not be refreshed still names the definition, and says it is stale on the
    // same terms as the results collections beside it.
    return {
      status: "resolved",
      content: resolveSectionFreshness(readState),
      name: entry.name,
      target: { ...entry.identity, ...(definition.version ? { version: definition.version } : {}) },
    };
  }
  // Only a read that answered can establish that a definition is absent. A refusal clears the
  // catalogue and a failure never filled it, so neither one's silence is evidence the definition
  // never existed, and neither may be reported as one.
  return readState.kind === "available" ? { status: "not-found" } : { status: "unreadable" };
};

const matchesSearch = (item: ResultItem, searchValue: string) => {
  switch (item.kind) {
    case "instance":
      return search([item.data.job_name, item.data.name, item.data.phase], searchValue);
    case "task":
      return search([item.data.processing_stage, item.data.purpose], searchValue);
    case "workflow":
      return search([item.data.name, item.data.id], searchValue);
  }
};

/**
 * Applies the Results section's own route state to the results the project owns. The state comes
 * from the section's query allowlist alone, so nothing outside Results can change what is fetched
 * or shown. Narrowing to a definition is entirely client-side and happens here beside the type and
 * search narrowing, so no request argument ever varies with it.
 *
 * The definition is the one the catalogue resolved rather than the one the URL named: a filter the
 * catalogue could not resolve narrows nothing, which is what leaves a stale link on a usable page.
 */
export const filterResultItems = (
  items: readonly ResultItem[],
  {
    search: searchValue = "",
    types,
  }: { search?: string; types?: readonly ResultFilterType[] } = {},
  definition?: ResultsDefinitionTarget,
): ResultItem[] =>
  items
    .filter((item) => showsType(types, item.kind))
    .filter((item) => definition === undefined || matchesDefinition(item, definition))
    .filter((item) => matchesSearch(item, searchValue));

/**
 * The definition an empty Results list may name: one the catalogue resolved that this project has
 * no results for at all. An empty list is only that definition's silence when the definition alone
 * emptied it — the caller's own search can empty a list the definition has plenty in, and stating
 * their narrowing as "this has never run here" would be false.
 */
export const unrunResultsDefinition = (
  items: readonly ResultItem[],
  resolution: ResultsDefinitionResolution,
): ResolvedResultsDefinition | undefined =>
  resolution.status === "resolved" && filterResultItems(items, {}, resolution.target).length === 0
    ? resolution
    : undefined;

/** How each Results collection's own last read answered, keyed by the results it carries. */
export type ResultsReadStates = Record<ResultFilterType, SectionReadState>;

/**
 * What the section must say about the reads it made, each read reported on its own. The definition
 * catalogue is read only while a filter is set, and when it is read it is reported on exactly the
 * same terms as the collections beside it.
 */
export const resolveResultsReadReport = (
  states: ResultsReadStates,
  definition?: SectionReadState,
): SectionReadReport =>
  resolveSectionReadReport([...Object.values(states), ...(definition ? [definition] : [])]);

/**
 * Each collection's content is only as fresh as its own last read, so a collection that answered
 * is never locked because a different one failed.
 */
export const resolveResultsFreshnessByCollection = (
  states: ResultsReadStates,
): Record<ResultFilterType, "current" | "stale"> => resolveSectionFreshnessByKey(states);
