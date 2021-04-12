import { initAuth0 } from '@auth0/nextjs-auth0';

export const auth0 = initAuth0({
  baseURL: 'http://localhost:3000',
  secret: 'LONG_RANDOM_VALUE',
  issuerBaseURL: 'https://squonk.informaticsmatters.org/auth/realms/squonk',
  clientID: 'next-effector-poc-confidential-2',
  clientSecret: 'f73baa27-6aa4-4b77-8d64-c27c7f411e6d',
  enableTelemetry: false,
  auth0Logout: false,
});
