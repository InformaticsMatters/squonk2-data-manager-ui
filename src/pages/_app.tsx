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
import { SnackbarProvider } from "notistack";

import { ThemeProviders } from "../components/app/ThemeProviders";
import { TopLevelHooks } from "../components/app/TopLevelHooks";
import { EventStream } from "../components/EventStream";
import { openSansFont } from "../constants/fonts";
import { AS_API_URL, DM_API_URL } from "../constants/proxies";
import { MDXComponentProvider } from "../context/MDXComponentProvider";

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
  EmotionCacheProviderProps & {
    pageProps: { dehydratedState?: unknown };
  };

const App = ({ Component, pageProps }: CustomAppProps) => {
  // React-Query
  const queryClient = useMemo(() => new QueryClient(), []);

  // Vercel specific code is only imported if needed
  // if (process.env.NEXT_PUBLIC_VERCEL_URL) {
  //   import("../utils/next/vercelRedirect").then(({ vercelRedirect }) => vercelRedirect());
  // }

  return (
    <StrictMode>
      <AppCacheProvider {...pageProps}>
        <Head>
          <meta content="minimum-scale=1, initial-scale=1, width=device-width" name="viewport" />
          <style>{openSansFontCss}</style>
        </Head>
        <ThemeProviders>
          <UserProvider
            loginUrl={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/login`}
            profileUrl={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/me`}
          >
            <QueryClientProvider client={queryClient}>
              <HydrationBoundary state={pageProps.dehydratedState}>
                <SnackbarProvider>
                  <EventStream />
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
      </AppCacheProvider>
    </StrictMode>
  );
};

export default App;
