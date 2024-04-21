import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { useKeycloakUser, type User } from "./useKeycloakUser";

const getPrevailingRole = (user: Partial<User>, roles: string[]) => {
  const reversedRoles = [...roles].reverse();
  if (user.username !== undefined && user.roles) {
    for (const role of reversedRoles) {
      if (user.roles.includes(role)) {
        return role;
      }
    }
  }
  return undefined;
};

export const useDMAuthorizationStatus = () => {
  const { user } = useKeycloakUser();
  return getPrevailingRole(user, DM_ROLES);
};

export const useASAuthorizationStatus = () => {
  const { user } = useKeycloakUser();
  return getPrevailingRole(user, AS_ROLES);
};

/**
 * Gets the users authorization status.
 *
 * The user can either be an evaluator, user or and admin
 */
export const useIsAuthorized = (): [string | undefined, string | undefined] => {
  return [useDMAuthorizationStatus(), useASAuthorizationStatus()];
};
