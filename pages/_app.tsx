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
import Head from 'next/head';

import { MDXComponentProvider } from '../components/MDXComponentProvider';
import { SelectedFilesProvider } from '../components/state/FileSelectionContext';

import '../styles/globalStyles.scss';

const { darkTheme, lightTheme } = generateThemes();

// ? Is this the right place to set this?
setBaseUrl(process.env.NEXT_PUBLIC_BASE_PATH + '/api/dm-api');

// Adjust template for material-ui given at
// https://github.com/mui-org/material-ui/tree/master/examples/nextjs

export default function App({ Component, pageProps }: AppProps) {
  // ! Need resolutions in monorepo package.json for <Theme></Theme> to not cause "invalid hooks usage" error

  // React-Query
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  // Material UI for SSR
  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = prefersDarkMode ? darkTheme : lightTheme;

  return (
    <>
      <Head>
        <meta content="minimum-scale=1, initial-scale=1, width=device-width" name="viewport" />
      </Head>
      <StylesProvider injectFirst>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <ThemeProvider theme={theme}>
            <UserProvider>
              <QueryClientProvider client={queryClientRef.current}>
                <Hydrate state={pageProps.dehydratedState}>
                  <SelectedFilesProvider>
                    <MDXComponentProvider>
                      <Component {...pageProps} />
                    </MDXComponentProvider>
                  </SelectedFilesProvider>
                </Hydrate>
              </QueryClientProvider>
            </UserProvider>
          </ThemeProvider>
        </MuiThemeProvider>
      </StylesProvider>
    </>
  );
}
