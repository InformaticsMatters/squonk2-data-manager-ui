import React from 'react';

import Keycloak, { KeycloakError, KeycloakInitOptions } from 'keycloak-js';

import { Container, Paper, Typography } from '@material-ui/core';
import { KeycloakEvent, KeycloakProvider, KeycloakTokens } from '@react-keycloak/web';

import DataTable from './DataTable';
import Loader from './Loader';
import LoginButton from './LoginButton';
import APIService from './Services/APIService';
import LocalStorageService from './Services/LocalStorageService';

// Auth

const keycloak = Keycloak('/keycloak.json');

const keycloakProviderInitConfig: KeycloakInitOptions = {
  token: LocalStorageService.getKeycloakTokens()?.token,
  idToken: LocalStorageService.getKeycloakTokens()?.idToken,
  refreshToken: LocalStorageService.getKeycloakTokens()?.refreshToken,
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

// Mock data
const rows = [
  { id: 0, fileName: 'poses.sdf', projects: ['p1', 'p2'], labels: ['a', 'b'] },
  { id: 1, fileName: 'protein.pdb', projects: ['p1', 'p3'], labels: ['c', 'b'] },
];

const App = () => {
  return (
    <KeycloakProvider
      keycloak={keycloak}
      initConfig={keycloakProviderInitConfig}
      onEvent={onKeycloakEvent}
      onTokens={onKeycloakTokens}
      LoadingComponent={<Loader open reason={'Authenticating...'} />}
    >
      <Container>
        <Typography variant="h1">Data Tier</Typography>
        <LoginButton />
        <Paper>
          <DataTable rows={rows} />
        </Paper>
      </Container>
    </KeycloakProvider>
  );
};

export default App;
