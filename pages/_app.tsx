import React, { useRef } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Hydrate } from 'react-query/hydration';

import { setBaseUrl } from '@squonk/data-manager-client';

import { UserProvider } from '@auth0/nextjs-auth0';
import { enableMapSet } from 'immer';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import { ThemeProviders } from '../components/ThemeProviders';
import { ColorSchemeProvider } from '../context/colorSchemeContext';
import { SelectedFilesProvider } from '../context/fileSelectionContext';
import { MDXComponentProvider } from '../context/MDXComponentProvider';

import '../styles/globalStyles.scss';

// ? Is this the right place to set this?
setBaseUrl(process.env.NEXT_PUBLIC_BASE_PATH + '/api/dm-api');

enableMapSet();

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

  return (
    <>
      <Head>
        <meta content="minimum-scale=1, initial-scale=1, width=device-width" name="viewport" />
      </Head>
      <ColorSchemeProvider>
        <ThemeProviders>
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
        </ThemeProviders>
      </ColorSchemeProvider>
    </>
  );
}
