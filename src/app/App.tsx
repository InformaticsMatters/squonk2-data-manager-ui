import React from 'react';

import Keycloak, { KeycloakError, KeycloakInitOptions } from 'keycloak-js';
import { ThemeProvider } from 'styled-components';

import {
  createMuiTheme,
  StylesProvider,
  ThemeProvider as MuiThemeProvider,
} from '@material-ui/core/styles';
import { KeycloakEvent, KeycloakProvider, KeycloakTokens } from '@react-keycloak/web';

import Loader from '../components/Loader';
import { ProjectsProvider } from '../context/projects';
import DataTierAPI from '../Services/DataTierAPI';
import LocalStorageService from '../Services/LocalStorageService';
import MainView from './MainView';

// Auth
const keycloak = Keycloak('./keycloak.json'); // TODO: make the subpath programmatic

const keycloakProviderInitConfig: KeycloakInitOptions = {
  onLoad: 'login-required',
  checkLoginIframe: false, // Without this reload of browser will prevent autologin
};

const onKeycloakEvent = (event: KeycloakEvent, error: KeycloakError | undefined) => {
  console.log('onKeycloakEvent', event, error);
};

const onKeycloakTokens = (tokens: KeycloakTokens) => {
  console.log('onKeycloakTokens', tokens);
  DataTierAPI.setToken(tokens.token);
  LocalStorageService.saveKeycloakTokens(tokens);
};

export const theme = createMuiTheme();

const App = () => {
  return (
    <StylesProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <ThemeProvider theme={theme}>
          <KeycloakProvider
            keycloak={keycloak}
            initConfig={keycloakProviderInitConfig}
            onEvent={onKeycloakEvent}
            onTokens={onKeycloakTokens}
            isLoadingCheck={(keycloak) => !!keycloak.authenticated && !DataTierAPI.getToken()}
            LoadingComponent={<Loader open reason={'Authenticating...'} />}
          >
            <ProjectsProvider>
              <MainView />
            </ProjectsProvider>
          </KeycloakProvider>
        </ThemeProvider>
      </MuiThemeProvider>
    </StylesProvider>
  );
};

export default App;
