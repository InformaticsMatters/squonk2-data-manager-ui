import { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';

import { UserProvider } from '@auth0/nextjs-auth0';
import { setBaseUrl } from '@squonk/data-manager-client';

const queryClient = new QueryClient();

// ? Is this the right place to set this?
setBaseUrl('/api/dm-api');

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </UserProvider>
  );
}
