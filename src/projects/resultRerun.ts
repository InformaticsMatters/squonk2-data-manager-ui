import { type InstanceSummary } from "@/api/data-manager";

import { type ResultInstanceFacts, resultInstanceJob } from "./instanceFacts";
import { instanceOwner } from "./resultFacts";

/**
 * The one pairing a rerun may be sent for: a concrete instance, the job definition it ran, and the
 * single project that both authorised it and will own what it creates. There is only one project
 * here because there is only one a rerun could correctly name — holding the instance's owner and
 * the URL's project apart would let a command be composed from the wrong half of a pairing this
 * client had already recognised as wrong.
 */
export type RerunTarget = {
  instanceId: string;
  /** The job version the instance ran, which is the identity its rerun is prefilled from. */
  jobId: number;
  projectId: string;
};

/**
 * What running one addressed instance again would target, or `null` where nothing may be sent.
 *
 * A rerun is refused three ways, and the caller cannot tell them apart from what this returns:
 * an instance that ran no job this client can address has no definition to run again; an instance
 * that declares a project other than the addressed one is a pairing this client has already
 * refused to display, so it may not compose a command either; and only an instance whose own
 * account agrees with the URL yields a target at all.
 *
 * The project it yields is the URL's own, never the instance's. The two are equal wherever a
 * target exists, and naming the verified one is what makes a rerun impossible to send into a
 * project the caller was not already looking at.
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
  if (jobId === undefined) {
    return null;
  }
  const owner = instanceOwner(instance);
  if (owner !== undefined && owner !== routeProjectId) {
    return null;
  }
  return { instanceId, jobId, projectId: routeProjectId };
};
