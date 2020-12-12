import { useKeycloak } from '@react-keycloak/web';

export const useIsAuthenticated = () => {
  const { keycloak, initialized } = useKeycloak();

  // console.debug(initialised, keycloak?.authenticated, keycloak?.token)
  return initialized && !!keycloak?.authenticated && !!keycloak?.token;
};

export default useIsAuthenticated;
