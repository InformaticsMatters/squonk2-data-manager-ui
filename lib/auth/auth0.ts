import { initAuth0 } from '@auth0/nextjs-auth0';

export const auth0 = initAuth0({
  baseURL: process.env.URL,
  secret: process.env.AUTH0_SECRET,
  issuerBaseURL: process.env.KEYCLOAK_URL + '/realms/squonk',
  clientID: process.env.KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  enableTelemetry: false,
  auth0Logout: false,
  session: {
    rolling: false,
  },
});
