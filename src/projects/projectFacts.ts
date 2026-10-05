import { getGetUserAccountSuspenseQueryOptions } from "@/api/data-manager/user";

import { useQuery } from "@tanstack/react-query";

import {
  type ProjectCapabilityFacts,
  type ProjectRoles,
  resolveProjectRoles,
} from "./capabilities";
import { describeProjectSubscription, type ProjectSubscriptionFacts } from "./projectSubscription";
import { type ProjectWorkspace, useRouteProject } from "./useRouteProject";

/**
 * The caller's own account, which decides their roles in the project. It is read in parallel with
 * the project and the workspace waits for it, so a section mounts with confirmed facts rather than
 * inserting what the caller may not do once the account arrives. A failed read still mounts the
 * workspace, whose facts then stay `stale` and defer to the server.
 */
export const callerAccountRead = getGetUserAccountSuspenseQueryOptions(undefined, {
  query: { retry: false },
});

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
 * The workspace mounts only once the account has settled, so facts are `current` from the first
 * render; they stay `stale` only where the account could not be read, and then an unresolved
 * caller defers to server authority instead of guessing at membership. Only a section beneath the
 * project workspace may ask.
 *
 * A project whose ancestry could not be read still has facts: it has its own membership, roles and
 * privacy, and only the subscription is missing from them.
 */
export const useProjectFacts = (): ProjectFacts => {
  const { ancestry, project } = useRouteProject();
  const account = useQuery(callerAccountRead);

  if (!ancestry || !project) {
    throw new Error("Project facts are only available beneath the project workspace");
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
