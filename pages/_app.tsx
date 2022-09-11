import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { Hydrate } from "react-query/hydration";

import { setBaseUrl as setASBaseUrl } from "@squonk/account-server-client";
import { setBaseUrl as setDMBaseUrl } from "@squonk/data-manager-client";

import { UserProvider } from "@auth0/nextjs-auth0";
import type { EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { enableMapSet } from "immer";
import type { AppProps } from "next/app";
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
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);

  // Vercel specific code is only imported if needed
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    import("../utils/next/vercelRedirect").then(({ vercelRedirect }) => vercelRedirect());
  }

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta content="minimum-scale=1, initial-scale=1, width=device-width" name="viewport" />
      </Head>
      <ThemeProviders>
        <UserProvider>
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools />
            <Hydrate state={pageProps.dehydratedState}>
              <SnackbarProvider>
                <MDXComponentProvider>
                  <TopLevelHooks>
                    <Component {...pageProps} />
                  </TopLevelHooks>
                </MDXComponentProvider>
              </SnackbarProvider>
            </Hydrate>
          </QueryClientProvider>
        </UserProvider>
      </ThemeProviders>
    </CacheProvider>
  );
}
