import { useKeycloak } from '@react-keycloak/web';

export const useIsAuthenticated = () => {
  const { keycloak } = useKeycloak();

  return keycloak?.authenticated;
};
