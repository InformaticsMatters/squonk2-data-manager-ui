import { useGetUserAccount } from "@/api/data-manager/user";

import {
  type ProjectCapabilityFacts,
  type ProjectRoles,
  resolveProjectRoles,
} from "./capabilities";
import { describeProjectSubscription, type ProjectSubscriptionFacts } from "./projectSubscription";
import { type ProjectWorkspace, useRouteProject } from "./useRouteProject";

/**
 * Everything Manage reads: the resolved workspace of the project in the URL, the caller's roles in
 * it, its subscription, and the capability facts the evaluators take. The subscription doubles as
 * the evaluators' billing fact, so there is only ever one description of it.
 */
export type ProjectFacts = ProjectCapabilityFacts &
  ProjectWorkspace & { roles: ProjectRoles; subscription: ProjectSubscriptionFacts };

/**
 * Resolves those facts from the project in the URL and the caller's own generated account resource.
 * Facts stay `stale` until the account answers, so an unresolved caller defers to server authority
 * instead of guessing at membership. Returns `undefined` until the project workspace has mounted.
 */
export const useProjectFacts = (): ProjectFacts | undefined => {
  const workspace = useRouteProject();
  const account = useGetUserAccount(undefined, { query: { retry: false } });
  const { organisation, product, project, unit } = workspace;

  if (!organisation || !product || !project || !unit) {
    return undefined;
  }

  const username = account.data?.user.username;

  return {
    caller: { username },
    freshness: account.isSuccess ? "current" : "stale",
    organisation,
    product,
    project,
    roles: resolveProjectRoles(project, username),
    subscription: describeProjectSubscription(product),
    unit,
  };
};
