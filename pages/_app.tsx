import React, { useRef } from 'react';

import '../styles/globalStyles.scss';

import { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Hydrate } from 'react-query/hydration';

import { UserProvider } from '@auth0/nextjs-auth0';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline, useTheme } from '@material-ui/core';
import { setBaseUrl } from '@squonk/data-manager-client';
import { MuiTheme } from '@squonk/mui-theme';

export const queryClient = new QueryClient();

// ? Is this the right place to set this?
setBaseUrl('/api/dm-api');

export default function App({ Component, pageProps }: AppProps) {
  // ! Need resolutions in package.json for <Theme></Theme> to not cause "invalid hooks usage" error

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
          <QueryClientProvider client={queryClient}>
            <Hydrate state={pageProps.dehydratedState}>
              <Component {...pageProps} />
            </Hydrate>
          </QueryClientProvider>
        </UserProvider>
      </ThemeProvider>
    </MuiTheme>
  );
}
