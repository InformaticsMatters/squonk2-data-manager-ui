import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Hydrate } from 'react-query/hydration';

import { setBaseUrl as setASBaseUrl } from '@squonk/account-server-client';
import { setBaseUrl as setDMBaseUrl } from '@squonk/data-manager-client';

import { UserProvider } from '@auth0/nextjs-auth0';
import type { EmotionCache } from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { enableMapSet } from 'immer';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SnackbarProvider } from 'notistack';

import { ThemeProviders } from '../components/ThemeProviders';
import { AS_API_URL, DM_API_URL, PROJECT_LOCAL_STORAGE_KEY } from '../constants';
import { ColorSchemeProvider } from '../context/colorSchemeContext';
import { SelectedFilesProvider } from '../context/fileSelectionContext';
import { MDXComponentProvider } from '../context/MDXComponentProvider';
import { OrganisationUnitProvider } from '../context/organisationUnitContext';
import type { ProjectLocalStoragePayload } from '../hooks/projectHooks';
import createEmotionCache from '../utils/createEmotionCache';
import { getFromLocalStorage } from '../utils/localStorage';

import '../styles/globalStyles.scss';

const clientSideEmotionCache = createEmotionCache();

setDMBaseUrl(DM_API_URL);
setASBaseUrl(AS_API_URL);

enableMapSet();

// Adjust template for MUI given at
// https://github.com/mui/material-ui/blob/master/examples/nextjs-with-typescript/pages/_app.tsx

type CustomAppProps = AppProps & { emotionCache?: EmotionCache };

export default function App({
  Component,
  pageProps,
  emotionCache = clientSideEmotionCache,
}: CustomAppProps) {
  // React-Query
  const [queryClient] = useState(() => new QueryClient());

  // Material UI for SSR
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);

  const router = useRouter();

  useEffect(
    () => {
      const { projectId } = getFromLocalStorage<
        ProjectLocalStoragePayload | Record<string, undefined>
      >(PROJECT_LOCAL_STORAGE_KEY, {});

      if (router.isReady && projectId) {
        router.push({ pathname: router.pathname, query: { project: projectId, ...router.query } });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.query.project],
  );

  // Vercel specific code is only imported if needed
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    import('../utils/vercelRedirect').then(({ vercelRedirect }) => vercelRedirect());
  }

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta content="minimum-scale=1, initial-scale=1, width=device-width" name="viewport" />
      </Head>
      <ColorSchemeProvider>
        <ThemeProviders>
          <UserProvider>
            <QueryClientProvider client={queryClient}>
              <Hydrate state={pageProps.dehydratedState}>
                <SnackbarProvider>
                  <SelectedFilesProvider>
                    <MDXComponentProvider>
                      <OrganisationUnitProvider>
                        <Component {...pageProps} />
                      </OrganisationUnitProvider>
                    </MDXComponentProvider>
                  </SelectedFilesProvider>
                </SnackbarProvider>
              </Hydrate>
            </QueryClientProvider>
          </UserProvider>
        </ThemeProviders>
      </ColorSchemeProvider>
    </CacheProvider>
  );
}
