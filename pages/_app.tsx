import React, { useRef } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Hydrate } from 'react-query/hydration';

import { setBaseUrl } from '@squonk/data-manager-client';
import { generateThemes } from '@squonk/mui-theme';

import { UserProvider } from '@auth0/nextjs-auth0';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline, useMediaQuery } from '@material-ui/core';
import { StylesProvider, ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import type { AppProps } from 'next/app';

import { SelectedFilesProvider } from '../components/state/FileSelectionContext';

import '../styles/globalStyles.scss';

const { darkTheme, lightTheme } = generateThemes();

// ? Is this the right place to set this?
setBaseUrl(process.env.NEXT_PUBLIC_BASE_PATH + '/api/dm-api');

export default function App({ Component, pageProps }: AppProps) {
  // ! Need resolutions in monorepo package.json for <Theme></Theme> to not cause "invalid hooks usage" error

  const queryClientRef = useRef<QueryClient | null>(null);

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = prefersDarkMode ? darkTheme : lightTheme;

  return (
    <StylesProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeProvider theme={theme}>
          <UserProvider>
            <QueryClientProvider client={queryClientRef.current}>
              <Hydrate state={pageProps.dehydratedState}>
                <SelectedFilesProvider>
                  <Component {...pageProps} />
                </SelectedFilesProvider>
              </Hydrate>
            </QueryClientProvider>
          </UserProvider>
        </ThemeProvider>
      </MuiThemeProvider>
    </StylesProvider>
  );
}
