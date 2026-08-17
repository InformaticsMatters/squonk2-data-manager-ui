import { captureException } from "@sentry/nextjs";
import { betterAuth } from "better-auth";
import { genericOAuth, type GenericOAuthConfig, keycloak } from "better-auth/plugins";
import { jwtDecode } from "jwt-decode";

import { withBasePath } from "../utils/app/basePath";

// `new URL` throws on an undefined base, and this module is imported while `next build` collects
// page data — a build that deliberately carries no runtime configuration, since the image is built
// once and deployed against whichever base URL the environment sets. Resolving to undefined when
// the base is absent keeps the module importable at build time; every deployment sets the variable,
// so the value handed to Keycloak in a running instance is unchanged.
const keycloakRedirectURI = process.env.BETTER_AUTH_BASE_URL
  ? new URL(withBasePath("/api/auth/callback/keycloak"), process.env.BETTER_AUTH_BASE_URL).href
  : undefined;

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

  // Rate limiting is on unless a deployment says otherwise, and nothing here knows why one would.
  // A deployment that signs the same identity in repeatedly through the OAuth callback shares one
  // counter for every sign-in, because a callback is reached by redirect and carries no forwarded
  // address to distinguish them; turning the limit off is that operator's deliberate choice.
  rateLimit: { enabled: process.env.BETTER_AUTH_RATE_LIMIT_ENABLED !== "false" },

  plugins: [
    genericOAuth({
      config: [
        {
          ...keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID as string,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
            issuer: process.env.KEYCLOAK_ISSUER_URL as string,
            redirectURI: keycloakRedirectURI,
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
