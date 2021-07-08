import React, { useRef } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Hydrate } from 'react-query/hydration';

import { setBaseUrl } from '@squonk/data-manager-client';
import { MuiTheme } from '@squonk/mui-theme';

import { UserProvider } from '@auth0/nextjs-auth0';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline, useTheme } from '@material-ui/core';
import { AppProps } from 'next/app';

import { CurrentProjectProvider } from '../components/CurrentProjectContext';
import { SelectedFilesProvider } from '../components/DataTable/FileSelectionContext';

import '../styles/globalStyles.scss';

// ? Is this the right place to set this?
setBaseUrl(process.env.NEXT_PUBLIC_BASE_PATH + '/api/dm-api');

export default function App({ Component, pageProps }: AppProps) {
  // ! Need resolutions in monorepo package.json for <Theme></Theme> to not cause "invalid hooks usage" error

  const queryClientRef = useRef<QueryClient | null>(null);

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  const theme = useTheme();
  return (
    <MuiTheme>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <UserProvider>
          <QueryClientProvider client={queryClientRef.current}>
            <Hydrate state={pageProps.dehydratedState}>
              <CurrentProjectProvider>
                <SelectedFilesProvider>
                  <Component {...pageProps} />
                </SelectedFilesProvider>
              </CurrentProjectProvider>
            </Hydrate>
          </QueryClientProvider>
        </UserProvider>
      </ThemeProvider>
    </MuiTheme>
  );
}
