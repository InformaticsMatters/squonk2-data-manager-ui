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
 * the evaluators' billing fact, so there is only ever one description of it, and it is absent for
 * exactly the projects whose ancestry could not be read.
 */
export type ProjectFacts = ProjectCapabilityFacts &
  ProjectWorkspace & { roles: ProjectRoles; subscription?: ProjectSubscriptionFacts };

/**
 * Resolves those facts from the project in the URL and the caller's own generated account resource.
 * Facts stay `stale` until the account answers, so an unresolved caller defers to server authority
 * instead of guessing at membership. Returns `undefined` until the project workspace has mounted.
 *
 * A project whose ancestry could not be read still has facts: it has its own membership, roles and
 * privacy, and only the subscription is missing from them.
 */
export const useProjectFacts = (): ProjectFacts | undefined => {
  const { ancestry, project } = useRouteProject();
  const account = useGetUserAccount(undefined, { query: { retry: false } });

  if (!ancestry || !project) {
    return undefined;
  }

  const username = account.data?.user.username;

  return {
    ancestry,
    caller: { username },
    freshness: account.isSuccess ? "current" : "stale",
    project,
    roles: resolveProjectRoles(project, username),
    ...(ancestry.kind === "resolved"
      ? { subscription: describeProjectSubscription(ancestry.product) }
      : {}),
  };
};
