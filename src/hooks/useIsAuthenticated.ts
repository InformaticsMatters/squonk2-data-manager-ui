import { useKeycloak } from '@react-keycloak/web';

export const useIsAuthenticated = () => {
  const [keycloak, initialised] = useKeycloak();

  // console.debug(initialised, keycloak?.authenticated, keycloak?.token)
  return initialised && !!keycloak?.authenticated && !!keycloak?.token;
};

export default useIsAuthenticated;
