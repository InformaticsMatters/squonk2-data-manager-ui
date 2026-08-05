import {
  type InstanceSummary,
  type RunningWorkflowSummary,
  type TaskSummary,
} from "@/api/data-manager";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import { search } from "../utils/app/searches";
import { type ResultFilterType } from "./routes";

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

const ownedBy = (declaredOwner: string | undefined, projectId: string) =>
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
 * or shown.
 */
export const filterResultItems = (
  items: readonly ResultItem[],
  {
    search: searchValue = "",
    types,
  }: { search?: string; types?: readonly ResultFilterType[] } = {},
): ResultItem[] =>
  items
    .filter((item) => !types || types.includes(item.kind))
    .filter((item) => matchesSearch(item, searchValue));

/**
 * What the section may show for the reads it made. A confirmed refusal or absence clears the
 * content, because loaded results must not remain visible once access to them is known to be gone.
 * Everything else — including an unclassifiable failure — is treated as recoverable, so a
 * transient outage marks its content stale and offers retry rather than claiming access was lost.
 */
export type ResultsReadState =
  | { kind: "available" }
  | { kind: "recoverable"; retryable: true }
  | { kind: "unavailable" };

/**
 * One addressed result answers by the same rule as the collections it belongs to: a refusal and an
 * absence are the same non-disclosing outcome, and anything else is retried rather than believed.
 */
export const resolveResultReadState = (error: unknown): ResultsReadState =>
  resolveResultsReadState([error]);

export const resolveResultsReadState = (errors: readonly unknown[]): ResultsReadState => {
  const failures = errors.filter((error) => error !== null && error !== undefined);
  if (failures.length === 0) {
    return { kind: "available" };
  }
  const unavailable = failures.some((error) => {
    const kind = classifyTransportFailure(error).kind;
    return kind === "forbidden" || kind === "not-found";
  });
  return unavailable ? { kind: "unavailable" } : { kind: "recoverable", retryable: true };
};

/**
 * Content that could not be refreshed is stale. Stale content is still worth reading, so it stays
 * on screen and says so, but nothing it describes can be established as safe to change.
 */
export const resolveResultsFreshness = (readState: ResultsReadState) =>
  readState.kind === "recoverable" ? ("stale" as const) : ("current" as const);
