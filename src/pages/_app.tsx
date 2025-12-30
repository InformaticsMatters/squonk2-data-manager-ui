import { StrictMode, useMemo } from "react";

import { setBaseUrl as setASBaseUrl } from "@squonk/account-server-client";
import { setBaseUrl as setDMBaseUrl } from "@squonk/data-manager-client";

import { UserProvider } from "@auth0/nextjs-auth0/client";
import {
  AppCacheProvider,
  type EmotionCacheProviderProps,
} from "@mui/material-nextjs/v15-pagesRouter";
import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { enableMapSet } from "immer";
import { type AppProps } from "next/app";
import Head from "next/head";

import { ConfiguredSnackbarProvider } from "../components/app/ConfiguredSnackbarProvider";
import { ThemeProviders } from "../components/app/ThemeProviders";
import { TopLevelHooks } from "../components/app/TopLevelHooks";
import { EventStream } from "../components/eventStream/EventStream";
import { openSansFont } from "../constants/fonts";
import { AS_API_URL, DM_API_URL } from "../constants/proxies";
import { MDXComponentProvider } from "../context/MDXComponentProvider";
import { withBasePath } from "../utils/app/basePath";

const openSansFontCss = `
:root {
  font-family: ${openSansFont.style.fontFamily};
  font-size: 14px;
}
`;

setDMBaseUrl(DM_API_URL);
setASBaseUrl(AS_API_URL);

enableMapSet();

// Adjust template for MUI given at
// https://github.com/mui/material-ui/blob/master/examples/nextjs-with-typescript/pages/_app.tsx

type CustomAppProps = AppProps &
  EmotionCacheProviderProps & { pageProps: { dehydratedState?: unknown } };

const App = ({ Component, pageProps }: CustomAppProps) => {
  // React-Query
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <StrictMode>
      <AppCacheProvider {...pageProps}>
        <Head>
          <meta content="minimum-scale=1, initial-scale=1, width=device-width" name="viewport" />
          <style>{openSansFontCss}</style>
        </Head>
        <ThemeProviders>
          <UserProvider
            loginUrl={withBasePath("/api/auth/login")}
            profileUrl={withBasePath("/api/auth/me")}
          >
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
          </UserProvider>
        </ThemeProviders>
      </AppCacheProvider>
    </StrictMode>
  );
};

export default App;
