import { useKeycloakUser } from './useKeycloakUser';

export const useIsAuthorized = () => {
  const { user } = useKeycloakUser();

  if (user.username !== undefined) {
    if (user.roles?.includes(process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE ?? '')) {
      return true;
    }
  }

  return false;
};
