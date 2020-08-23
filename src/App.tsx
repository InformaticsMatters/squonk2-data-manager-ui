import React from 'react';

import Keycloak, { KeycloakError, KeycloakInitOptions } from 'keycloak-js';

import { KeycloakEvent, KeycloakProvider, KeycloakTokens } from '@react-keycloak/web';

import Loader from './Loader';
import MainView from './MainView';
import APIService from './Services/APIService';
import LocalStorageService from './Services/LocalStorageService';

// Auth

const keycloak = Keycloak('/keycloak.json');

const keycloakProviderInitConfig: KeycloakInitOptions = {
  onLoad: 'check-sso',
  checkLoginIframe: false, // Without this reload of browser will prevent autologin
};

const onKeycloakEvent = (event: KeycloakEvent, error: KeycloakError | undefined) => {
  console.log('onKeycloakEvent', event, error);
};

const onKeycloakTokens = (tokens: KeycloakTokens) => {
  console.log('onKeycloakTokens', tokens);
  APIService.setToken(tokens.token);
  LocalStorageService.saveKeycloakTokens(tokens);
};

const App = () => {
  return (
    <KeycloakProvider
      keycloak={keycloak}
      initConfig={keycloakProviderInitConfig}
      onEvent={onKeycloakEvent}
      onTokens={onKeycloakTokens}
      isLoadingCheck={(keycloak) => {
        console.debug(APIService.getToken());
        return !!keycloak.authenticated && !APIService.getToken();
      }}
      LoadingComponent={<Loader open reason={'Authenticating...'} />}
    >
      <MainView />
    </KeycloakProvider>
  );
};

export default App;
