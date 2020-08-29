import React, { useState } from 'react';

import Keycloak, { KeycloakError, KeycloakInitOptions } from 'keycloak-js';

import { KeycloakEvent, KeycloakProvider, KeycloakTokens } from '@react-keycloak/web';

import Loader from '../components/Loader';
import DataTierAPI from '../Services/DataTierAPI';
import LocalStorageService from '../Services/LocalStorageService';
import MainView from './MainView';
import Theme from './Theme';

// Auth
const keycloak = Keycloak('./keycloak.json'); // TODO: make the subpath programmatic

const keycloakProviderInitConfig: KeycloakInitOptions = {
  onLoad: 'login-required',
  // onLoad: 'check-sso',
  checkLoginIframe: false, // Without this reload of browser will prevent autologin
};

const onKeycloakEvent = (event: KeycloakEvent, error: KeycloakError | undefined) => {
  console.log('onKeycloakEvent', event, error);
};

const App = () => {
  const [, setToken] = useState<KeycloakTokens | null>(null); // State to trigger rerender when

  const onKeycloakTokens = (tokens: KeycloakTokens) => {
    console.log('onKeycloakTokens', tokens);
    DataTierAPI.setToken(tokens.token);
    setToken(tokens);
    LocalStorageService.saveKeycloakTokens(tokens);
  };
  return (
    <Theme>
      <KeycloakProvider
        keycloak={keycloak}
        initConfig={keycloakProviderInitConfig}
        onEvent={onKeycloakEvent}
        onTokens={onKeycloakTokens}
        isLoadingCheck={(keycloak) => !!keycloak.authenticated && !DataTierAPI.getToken()}
        LoadingComponent={<Loader open reason={'Authenticating...'} />}
      >
        <MainView />
      </KeycloakProvider>
    </Theme>
  );
};

export default App;
