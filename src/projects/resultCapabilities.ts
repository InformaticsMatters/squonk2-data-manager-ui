import {
  evaluateResultArchiveCapability,
  evaluateResultRerunCapability,
  evaluateResultTaskDeletionCapability,
  evaluateResultTerminationCapability,
  evaluateResultWorkflowLifecycleCapability,
  type ProjectCapability,
  type ProjectResultFacts,
} from "./capabilities";
import { type ProjectFacts } from "./projectFacts";

export type ResultCapabilities = {
  archive: ProjectCapability;
  rerun: ProjectCapability;
  taskDeletion: ProjectCapability;
  termination: ProjectCapability;
  workflowLifecycle: ProjectCapability;
};

/**
 * What the caller may do with one concrete result. The facts are the result's own owning project,
 * the project in the URL, the project resource that URL resolved, and the caller's own account —
 * never a selected or current project. `projectFacts.ts` remains the only place those facts are
 * gathered; this only adds the result the caller is looking at.
 */
export const resolveResultCapabilities = (
  facts: ProjectFacts,
  {
    content = "current",
    owningProjectId,
    routeProjectId,
  }: { content?: "current" | "stale"; owningProjectId: string; routeProjectId: string },
): ResultCapabilities => {
  const resultFacts: ProjectResultFacts = { ...facts, content, owningProjectId, routeProjectId };

  return {
    archive: evaluateResultArchiveCapability(resultFacts),
    rerun: evaluateResultRerunCapability(resultFacts),
    taskDeletion: evaluateResultTaskDeletionCapability(resultFacts),
    termination: evaluateResultTerminationCapability(resultFacts),
    workflowLifecycle: evaluateResultWorkflowLifecycleCapability(resultFacts),
  };
};
