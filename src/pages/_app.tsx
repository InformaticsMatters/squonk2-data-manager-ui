import { useEffect, useMemo } from "react";

import { setBaseUrl as setASBaseUrl } from "@squonk/account-server-client";
import { setBaseUrl as setDMBaseUrl } from "@squonk/data-manager-client";

import { UserProvider } from "@auth0/nextjs-auth0/client";
import { type EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { enableMapSet } from "immer";
import { type AppProps } from "next/app";
import Head from "next/head";
import { SnackbarProvider } from "notistack";

import { ThemeProviders } from "../components/app/ThemeProviders";
import { TopLevelHooks } from "../components/app/TopLevelHooks";
import { AS_API_URL, DM_API_URL } from "../constants/proxies";
import { MDXComponentProvider } from "../context/MDXComponentProvider";
import createEmotionCache from "../utils/next/createEmotionCache";

import "../styles/globalStyles.scss";

const clientSideEmotionCache = createEmotionCache();

setDMBaseUrl(DM_API_URL);
setASBaseUrl(AS_API_URL);

enableMapSet();

// Adjust template for MUI given at
// https://github.com/mui/material-ui/blob/master/examples/nextjs-with-typescript/pages/_app.tsx

type CustomAppProps = AppProps & {
  emotionCache?: EmotionCache;
  pageProps: { dehydratedState?: unknown };
};

const App = ({ Component, pageProps, emotionCache = clientSideEmotionCache }: CustomAppProps) => {
  // React-Query
  const queryClient = useMemo(() => new QueryClient(), []);

  // Material UI for SSR
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      // eslint-disable-next-line unicorn/prefer-dom-node-remove
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);

  // Vercel specific code is only imported if needed
  // if (process.env.NEXT_PUBLIC_VERCEL_URL) {
  //   import("../utils/next/vercelRedirect").then(({ vercelRedirect }) => vercelRedirect());
  // }

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta content="minimum-scale=1, initial-scale=1, width=device-width" name="viewport" />
      </Head>
      <ThemeProviders>
        <UserProvider
          loginUrl={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/login`}
          profileUrl={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/me`}
        >
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={pageProps.dehydratedState}>
              <SnackbarProvider>
                <MDXComponentProvider>
                  <TopLevelHooks>
                    <Component {...pageProps} />
                  </TopLevelHooks>
                </MDXComponentProvider>
              </SnackbarProvider>
            </HydrationBoundary>
            <ReactQueryDevtools client={queryClient} />
          </QueryClientProvider>
        </UserProvider>
      </ThemeProviders>
    </CacheProvider>
  );
};

export default App;
