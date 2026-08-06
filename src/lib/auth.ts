import { captureException } from "@sentry/nextjs";
import { betterAuth } from "better-auth";
import { genericOAuth, keycloak } from "better-auth/plugins";
import { jwtDecode } from "jwt-decode";

import { getBasePath } from "../utils/app/basePath";

/**
 * better-auth derives the OAuth redirect URI from its own `baseURL` + `basePath`, neither of which
 * knows about Next's `basePath`. When the app is served under one, Keycloak is handed a callback
 * URL missing that prefix and the browser lands on a 404 on the way back from login, so we spell
 * the redirect URI out ourselves.
 *
 * Note this can't be fixed by folding the base path into `baseURL`/`basePath` below: Next strips
 * its own base path off `req.url` before the API route runs, and better-auth matches incoming
 * requests against `new URL(baseURL).pathname`. Those two have to stay un-prefixed.
 */
const getKeycloakRedirectURI = (): string | undefined => {
  const basePath = getBasePath();
  const baseURL = process.env.BETTER_AUTH_BASE_URL;

  // Without a base path better-auth's own default is already right, and without a base URL there is
  // no origin to build from — leave it to infer the redirect URI from the request as before.
  if (!basePath || !baseURL) {
    return undefined;
  }

  return `${baseURL.replace(/\/+$/u, "")}${basePath}/api/auth/oauth2/callback/keycloak`;
};

// No database config → better-auth defaults to memory adapter + cookie cache (stateless sessions)
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_BASE_URL,
  basePath: "/api/auth",

  user: {
    additionalFields: {
      preferred_username: { type: "string", required: false, input: false },
      given_name: { type: "string", required: false, input: false },
      family_name: { type: "string", required: false, input: false },
      realm_access: { type: "string", required: false, input: false }, // JSON string
    },
  },

  onAPIError: {
    onError: (error) => {
      captureException(error);
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          ...keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID as string,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
            issuer: process.env.KEYCLOAK_ISSUER_URL as string,
            scopes: ["openid", "profile", "email", "offline_access"],
            overrideUserInfo: true, // refresh realm_access roles on every re-login
            redirectURI: getKeycloakRedirectURI(),
          }),
          // eslint-disable-next-line @typescript-eslint/require-await
          getUserInfo: async (tokens) => {
            if (!tokens.accessToken) {
              throw new Error("No access token");
            }
            const decoded = jwtDecode<Record<string, unknown>>(tokens.accessToken);
            const idDecoded = tokens.idToken
              ? jwtDecode<Record<string, unknown>>(tokens.idToken)
              : decoded;
            const realmAccess = decoded.realm_access as { roles: string[] } | undefined;
            const email =
              (decoded.email as string | undefined) ??
              `${decoded.preferred_username as string}@keycloak.local`;
            return {
              id: decoded.sub as string,
              email,
              emailVerified: Boolean(decoded.email_verified),
              name: (decoded.name ?? decoded.preferred_username) as string,
              preferred_username: idDecoded.preferred_username as string,
              given_name: idDecoded.given_name as string | undefined,
              family_name: idDecoded.family_name as string | undefined,
              realm_access: JSON.stringify(realmAccess ?? { roles: [] }),
            };
          },
        },
      ],
    }),
  ],
});

export type Auth = typeof auth;
