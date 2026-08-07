import { captureException } from "@sentry/nextjs";
import { betterAuth } from "better-auth";
import { genericOAuth, type GenericOAuthConfig, keycloak } from "better-auth/plugins";
import { jwtDecode } from "jwt-decode";

import { withBasePath } from "../utils/app/basePath";

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

  // The acceptance suite signs in about a hundred times in as many seconds from one machine, and the
  // OAuth callback is reached by redirect, so it carries no forwarded address a fixture could vary.
  // Every callback therefore shares one rate-limit counter that never falls quiet long enough to
  // reset, and the suite starts answering `429` once it has simply grown long enough. Only the
  // fixture build says so: a real deployment keeps the limit it is entitled to.
  rateLimit: { enabled: process.env.ACCEPTANCE_FIXTURES !== "1" },

  plugins: [
    genericOAuth({
      config: [
        {
          ...keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID as string,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
            issuer: process.env.KEYCLOAK_ISSUER_URL as string,
            redirectURI: new URL(
              withBasePath("/api/auth/callback/keycloak"),
              process.env.BETTER_AUTH_BASE_URL,
            ).href,
            scopes: ["openid", "profile", "email", "offline_access"],
            // better-auth always sends code_verifier when exchanging the code, so the
            // challenge has to be on the authorize request or Keycloak rejects the exchange
            pkce: true,
            overrideUserInfo: true, // refresh realm_access roles on every re-login
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
          // better-auth only keeps id/email/emailVerified/image/name from getUserInfo and
          // spreads whatever mapProfileToUser returns, so the additionalFields have to be
          // carried across here or the session loses realm_access and every role gate 403s.
          // The cast is needed because mapProfileToUser is typed against the base user only.
          mapProfileToUser: ((profile: Record<string, unknown>) => ({
            preferred_username: profile.preferred_username,
            given_name: profile.given_name,
            family_name: profile.family_name,
            realm_access: profile.realm_access,
          })) as GenericOAuthConfig["mapProfileToUser"],
        },
      ],
    }),
  ],
});

export type Auth = typeof auth;
