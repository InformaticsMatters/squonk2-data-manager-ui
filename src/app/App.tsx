import React, { useState } from 'react';

import Keycloak, { KeycloakError, KeycloakInitOptions } from 'keycloak-js';

import { Container, Typography } from '@material-ui/core';
import { KeycloakEvent, KeycloakProvider, KeycloakTokens } from '@react-keycloak/web';

import Loader from '../components/Loader';
import LoginButton from '../components/LoginButton';
import { ProjectsProvider } from '../context/projects';
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
        <Container component="main">
          <Typography variant="h2" component="h1">
            Squonk Data
          </Typography>
          <LoginButton />
          {DataTierAPI.hasToken() && (
            <ProjectsProvider>
              <MainView />
            </ProjectsProvider>
          )}
        </Container>
      </KeycloakProvider>
    </Theme>
  );
};

export default App;
