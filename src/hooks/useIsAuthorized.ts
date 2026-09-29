import { AS_ADMIN_ROLE, AS_EVALUATOR_ROLE, AS_ROLES, DM_ROLES } from "../constants/auth";
import { useKeycloakUser, type User } from "./useKeycloakUser";

/**
 * The strongest of `roles` that `held` contains, where `roles` is ordered so each entry is a
 * superset of the one before it. An account holding both the user and the admin role is an admin.
 */
export const prevailingRole = (held: readonly string[] | undefined, roles: readonly string[]) =>
  held && roles.toReversed().find((role) => held.includes(role));

const getPrevailingRole = (user: Partial<User>, roles: string[]) =>
  user.username === undefined ? undefined : prevailingRole(user.roles, roles);

export const useDMAuthorizationStatus = () => {
  const { user } = useKeycloakUser();
  return getPrevailingRole(user, DM_ROLES);
};

export const useASAuthorizationStatus = () => {
  const { user } = useKeycloakUser();
  return getPrevailingRole(user, AS_ROLES);
};

/**
 * `AS_ROLES` is ordered so each role is a superset of the one before it, which is why the prevailing
 * role is the answer: an account that also holds the user role is not an evaluator.
 */
export const useIsEvaluator = () => {
  const callerRole = useASAuthorizationStatus();
  return !!AS_EVALUATOR_ROLE && callerRole === AS_EVALUATOR_ROLE;
};

/**
 * Whether the caller holds the account server's administrator role.
 *
 * The role widens what the account server returns: every organisation and unit in the deployment,
 * each reported with `caller_is_member` set, whether or not the caller belongs to it. Lists that
 * look unfiltered to an admin are that role, not a missing filter — see issue #2079.
 */
export const useIsPlatformAdmin = () => {
  const callerRole = useASAuthorizationStatus();
  return !!AS_ADMIN_ROLE && callerRole === AS_ADMIN_ROLE;
};

/**
 * Gets the users authorization status.
 *
 * The user can either be an evaluator, user or and admin
 */
export const useIsAuthorized = (): [string | undefined, string | undefined] => {
  return [useDMAuthorizationStatus(), useASAuthorizationStatus()];
};
