import React, { useCallback } from 'react';

import { KeycloakProfile } from 'keycloak-js';

import { useKeycloak } from '@react-keycloak/web';

import { usePromise } from '../hooks';

interface ProjectState {
  profile: KeycloakProfile | null;
  loading: boolean;
}

export const UserProfileContext = React.createContext<ProjectState>({
  profile: null,
  loading: true,
});

export const UserProfileProvider: React.FC = ({ children }) => {
  const { keycloak } = useKeycloak();

  const loadProfile = useCallback(() => keycloak?.loadUserProfile(), [keycloak]);

  const { data, loading } = usePromise(loadProfile, null);

  return (
    <UserProfileContext.Provider value={{ profile: data, loading }}>
      {children}
    </UserProfileContext.Provider>
  );
};
