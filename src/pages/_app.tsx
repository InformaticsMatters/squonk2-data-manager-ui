import { StrictMode, useMemo } from "react";

import {
  AXIOS_INSTANCE as AS_INSTANCE,
  setBaseUrl as setASBaseUrl,
} from "@squonk/account-server-client";
import {
  AXIOS_INSTANCE as DM_INSTANCE,
  setBaseUrl as setDMBaseUrl,
} from "@squonk/data-manager-client";

import {
  AppCacheProvider,
  type EmotionCacheProviderProps,
} from "@mui/material-nextjs/v15-pagesRouter";
import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type InternalAxiosRequestConfig } from "axios";
import { enableMapSet } from "immer";
import { type AppProps } from "next/app";
import Head from "next/head";

import { ConfiguredSnackbarProvider } from "../components/app/ConfiguredSnackbarProvider";
import { ThemeProviders } from "../components/app/ThemeProviders";
import { TopLevelHooks } from "../components/app/TopLevelHooks";
import { EventStream } from "../components/eventStream/EventStream";
import { openSansFont } from "../constants/fonts";
import { MDXComponentProvider } from "../context/MDXComponentProvider";
import { awaitTokenGate } from "../utils/api/tokenGate";

const openSansFontCss = `
:root {
  font-family: ${openSansFont.style.fontFamily};
  font-size: 14px;
}
`;

export const DM_API_URL = process.env.NEXT_PUBLIC_DATA_MANAGER_API_SERVER ?? "";
export const AS_API_URL = process.env.NEXT_PUBLIC_ACCOUNT_SERVER_API_SERVER ?? "";

setDMBaseUrl(DM_API_URL);
setASBaseUrl(AS_API_URL);

// Gate all DM/AS Axios requests until the auth token is first set.
// Runs once at module load (browser only) — already-resolved promises are
// synchronous no-ops, so there is no overhead on subsequent requests.

// After the gate opens, re-read Authorization from the instance's current defaults.
// We can't rely on what was merged into the config at request-initiation time because
// setAuthToken() may not have been called yet when the request was first queued.
const makeGateInterceptor =
  (instance: typeof DM_INSTANCE) => async (config: InternalAxiosRequestConfig) => {
    await awaitTokenGate();
    const auth = instance.defaults.headers.common.Authorization as string | undefined;
    if (auth) {
      config.headers.set("Authorization", auth);
    }
    return config;
  };
DM_INSTANCE.interceptors.request.use(makeGateInterceptor(DM_INSTANCE));
AS_INSTANCE.interceptors.request.use(makeGateInterceptor(AS_INSTANCE));

enableMapSet();

// Adjust template for MUI given at
// https://github.com/mui/material-ui/blob/master/examples/nextjs-with-typescript/pages/_app.tsx

type CustomAppProps = AppProps &
  EmotionCacheProviderProps & { pageProps: { dehydratedState?: unknown } };

const App = (props: CustomAppProps) => {
  const { Component, pageProps } = props;
  // React-Query
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <StrictMode>
      <AppCacheProvider {...props}>
        <Head>
          <meta content="minimum-scale=1, initial-scale=1, width=device-width" name="viewport" />
          <style>{openSansFontCss}</style>
        </Head>
        <ThemeProviders>
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={pageProps.dehydratedState}>
              <ConfiguredSnackbarProvider>
                <EventStream />
                <MDXComponentProvider>
                  <TopLevelHooks>
                    <Component {...pageProps} />
                  </TopLevelHooks>
                </MDXComponentProvider>
              </ConfiguredSnackbarProvider>
            </HydrationBoundary>
            <ReactQueryDevtools client={queryClient} />
          </QueryClientProvider>
        </ThemeProviders>
      </AppCacheProvider>
    </StrictMode>
  );
};

export default App;
