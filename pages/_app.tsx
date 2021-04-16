import React from 'react';

import '../styles/globalStyles.scss';

import { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';

import { UserProvider } from '@auth0/nextjs-auth0';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline, useTheme } from '@material-ui/core';
import { setBaseUrl } from '@squonk/data-manager-client';
import { MuiTheme } from '@squonk/mui-theme';

const queryClient = new QueryClient();
// ? Is this the right place to set this?
setBaseUrl('/api/dm-api');

export default function App({ Component, pageProps }: AppProps) {
  // ! Need resolutions in package.json for <Theme></Theme> to not cause "invalid hooks usage" error

  const theme = useTheme();
  return (
    <MuiTheme>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <UserProvider>
          <QueryClientProvider client={queryClient}>
            <Component {...pageProps} />
          </QueryClientProvider>
        </UserProvider>
      </ThemeProvider>
    </MuiTheme>
  );
}
