import { useCallback } from 'react';

import { KeycloakProfile } from 'keycloak-js';

import { useKeycloak } from '@react-keycloak/web';

import { usePromise } from './usePromise';

export const useUserProfile = () => {
  const { keycloak } = useKeycloak();

  const loadProfile = useCallback(keycloak?.loadUserProfile as () => Promise<KeycloakProfile>, []);

  const { data, loading } = usePromise(loadProfile, null);

  return { profile: data, profileLoading: loading };
};
