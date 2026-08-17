import { StrictMode, useMemo } from "react";

import { AXIOS_INSTANCE as AS_INSTANCE, setBaseUrl as setASBaseUrl } from "@/api/account-server";
import { AXIOS_INSTANCE as DM_INSTANCE, setBaseUrl as setDMBaseUrl } from "@/api/data-manager";

import {
  AppCacheProvider,
  type EmotionCacheProviderProps,
} from "@mui/material-nextjs/v15-pagesRouter";
import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { enableMapSet } from "immer";
import { type AppProps } from "next/app";
import Head from "next/head";

import { type ApiServers, loadApiServers, readApiServers } from "../application/apiServers";
import { PagePolicyComposer, type PolicyAppComponent } from "../application/PagePolicyComposer";
import { ConfiguredSnackbarProvider } from "../components/app/ConfiguredSnackbarProvider";
import { ThemeProviders } from "../components/app/ThemeProviders";
import { openSansFont } from "../constants/fonts";
import { MDXComponentProvider } from "../context/MDXComponentProvider";
import { awaitTokenGate } from "../utils/api/tokenGate";

const openSansFontCss = `
:root {
  font-family: ${openSansFont.style.fontFamily};
  font-size: 14px;
}
`;

// Where the APIs are is settled by the deployment, not by the build, so the addresses arrive after
// this module does. On the server they are read straight from the environment; the browser asks the
// server that served the page, and the gate below holds requests until the answer lands.
const applyApiServers = ({ dataManager, accountServer }: ApiServers) => {
  setDMBaseUrl(dataManager);
  setASBaseUrl(accountServer);
};

const resolveApiServers = async (): Promise<ApiServers> =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  globalThis.window === undefined ? readApiServers(process.env) : loadApiServers();

// Shared by every request: the addresses are settled once and awaited thereafter.
let apiServersReady: Promise<void> | undefined;
const awaitApiServers = async (): Promise<void> => {
  apiServersReady ??= resolveApiServers().then(applyApiServers);
  await apiServersReady;
};

// Gate all DM/AS Axios requests until the deployment's addresses are known and the auth token is
// first set. Runs once at module load (browser only) — already-resolved promises are
// synchronous no-ops, so there is no overhead on subsequent requests.

// After the gate opens, re-read Authorization and the base URL from the instance's current
// defaults. We can't rely on what was merged into the config at request-initiation time because
// neither setAuthToken() nor applyApiServers() may have been called yet when the request was
// first queued.
const makeGateInterceptor = (instance: typeof DM_INSTANCE) => {
  const interceptor: NonNullable<Parameters<typeof instance.interceptors.request.use>[0]> = async (
    config,
  ) => {
    await awaitApiServers();
    await awaitTokenGate();
    config.baseURL = instance.defaults.baseURL;
    const auth = instance.defaults.headers.common.Authorization as string | undefined;
    if (auth) {
      config.headers.set("Authorization", auth);
    }
    return config;
  };

  return interceptor;
};
DM_INSTANCE.interceptors.request.use(makeGateInterceptor(DM_INSTANCE));
AS_INSTANCE.interceptors.request.use(makeGateInterceptor(AS_INSTANCE));

enableMapSet();

// Adjust template for MUI given at
// https://github.com/mui/material-ui/blob/master/examples/nextjs-with-typescript/pages/_app.tsx

type CustomAppProps = EmotionCacheProviderProps &
  Omit<AppProps, "Component"> & {
    Component: PolicyAppComponent;
    pageProps: { dehydratedState?: unknown };
  };

const App = (props: CustomAppProps) => {
  const { Component, pageProps } = props;
  const pagePolicy = (Component as Partial<PolicyAppComponent>).pagePolicy;
  if (!pagePolicy) {
    throw new Error("Pages must declare a page composition policy");
  }
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
                <MDXComponentProvider>
                  <PagePolicyComposer policy={pagePolicy}>
                    <Component {...pageProps} />
                  </PagePolicyComposer>
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
