import { useState } from 'react';

import Keycloak, { KeycloakInitOptions } from 'keycloak-js';

import { AuthClientError, AuthClientEvent, AuthClientTokens } from '@react-keycloak/core';
import { ReactKeycloakProvider } from '@react-keycloak/web';

import Loader from '../components/Loader';
import DataTierAPI from '../Services/DataTierAPI';
import LocalStorageService from '../Services/LocalStorageService';
import MainView from './MainView';
import Theme from './Theme';

// Auth
const keycloak = Keycloak(process.env.PUBLIC_URL + '/keycloak.json');

const authInitOptions: KeycloakInitOptions = {
  onLoad: 'login-required',
  // onLoad: 'check-sso',
  // silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
};

const onKeycloakEvent = (event: AuthClientEvent, error: AuthClientError | undefined) => {
  console.log('onKeycloakEvent', event, error);
};

const App = () => {
  const [, setToken] = useState<AuthClientTokens | null>(null); // State to trigger rerender when

  const onKeycloakTokens = (tokens: AuthClientTokens) => {
    // console.log('onKeycloakTokens', tokens);
    const token = tokens.token;

    token && DataTierAPI.setToken(token);
    setToken(tokens);
    LocalStorageService.saveKeycloakTokens(tokens);
  };

  return (
    <Theme>
      <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={authInitOptions}
        onEvent={onKeycloakEvent}
        onTokens={onKeycloakTokens}
        // isLoadingCheck={(keycloak) => !!keycloak.authenticated && !DataTierAPI.getToken()}
        LoadingComponent={<Loader open reason={'Authenticating...'} />}
      >
        <MainView />
      </ReactKeycloakProvider>
    </Theme>
  );
};

export default App;
