import { type InstanceSummary, type RunningWorkflowSummary } from "@/api/data-manager";

import { isWorkflowId } from "../routing/identifiers";
import { type ResultInstanceFacts, resultInstanceJob } from "./instanceFacts";
import { instanceOwner, runningWorkflowOwner } from "./resultFacts";

/**
 * The one pairing a rerun may be sent for: a concrete result, the definition it ran, and the
 * single project that both authorised it and will own what it creates. There is only one project
 * here because there is only one a rerun could correctly name — holding the result's owner and
 * the URL's project apart would let a command be composed from the wrong half of a pairing this
 * client had already recognised as wrong.
 */
export type RerunTarget =
  | {
      collection: "instances";
      /** The job version the instance ran, which is the identity its rerun is prefilled from. */
      jobId: number;
      projectId: string;
      resultId: string;
    }
  | {
      collection: "workflows";
      projectId: string;
      resultId: string;
      /** The workflow the running workflow ran, which is the identity its rerun is prefilled from. */
      workflowId: string;
    };

/**
 * The project a rerun may name, or `null` where the result declares a project other than the
 * addressed one. That is a pairing this client has already refused to display, so it may not
 * compose a command either. The project yielded is the URL's own, never the result's: the two are
 * equal wherever a target exists, and naming the verified one is what makes a rerun impossible to
 * send into a project the caller was not already looking at.
 */
const rerunProject = (owner: string | undefined, routeProjectId: string) =>
  owner !== undefined && owner !== routeProjectId ? null : routeProjectId;

/**
 * What running one addressed instance again would target, or `null` where nothing may be sent.
 *
 * A rerun is refused three ways, and the caller cannot tell them apart from what this returns:
 * an instance that ran no job this client can address has no definition to run again; an instance
 * that declares a project other than the addressed one is a pairing this client has already
 * refused to display, so it may not compose a command either; and only an instance whose own
 * account agrees with the URL yields a target at all.
 */
export const resolveRerunTarget = ({
  instance,
  instanceId,
  routeProjectId,
}: {
  instance: Pick<InstanceSummary, "project_id"> &
    Pick<ResultInstanceFacts, "application_type" | "job_id">;
  instanceId: string;
  routeProjectId: string;
}): RerunTarget | null => {
  const jobId = resultInstanceJob(instance);
  const projectId = rerunProject(instanceOwner(instance), routeProjectId);
  if (jobId === undefined || projectId === null) {
    return null;
  }
  return { collection: "instances", jobId, projectId, resultId: instanceId };
};

/**
 * What running one addressed workflow again would target, or `null` where nothing may be sent. It
 * is refused on the same terms an instance's is: a running workflow naming no workflow this client
 * can address has nothing to run again, and one declaring another project composes nothing.
 */
export const resolveWorkflowRerunTarget = ({
  routeProjectId,
  workflow,
}: {
  routeProjectId: string;
  workflow: Pick<RunningWorkflowSummary, "id" | "project" | "workflow">;
}): RerunTarget | null => {
  const workflowId = workflow.workflow.id;
  const projectId = rerunProject(runningWorkflowOwner(workflow), routeProjectId);
  if (!isWorkflowId(workflowId) || projectId === null) {
    return null;
  }
  return { collection: "workflows", projectId, resultId: workflow.id, workflowId };
};
