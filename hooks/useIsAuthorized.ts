import { REQUIRED_ROLES } from "../constants/auth";
import { useKeycloakUser } from "./useKeycloakUser";

export const useIsAuthorized = () => {
  const { user } = useKeycloakUser();

  if (user.username !== undefined) {
    if (REQUIRED_ROLES.every((role) => user.roles?.includes(role))) {
      return true;
    }
  }

  return false;
};
