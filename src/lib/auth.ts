import { captureException } from "@sentry/nextjs";
import { betterAuth } from "better-auth";
import { genericOAuth, keycloak } from "better-auth/plugins";
import { jwtDecode } from "jwt-decode";

import { withBasePath } from "../utils/app/basePath";

// No database config → better-auth defaults to memory adapter + cookie cache (stateless sessions)
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_BASE_URL,
  basePath: "/api/auth",
  rateLimit: { enabled: process.env.BETTER_AUTH_RATE_LIMIT_DISABLED !== "true" },

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
            redirectURI: new URL(
              withBasePath("/api/auth/callback/keycloak"),
              process.env.BETTER_AUTH_BASE_URL,
            ).href,
            scopes: ["openid", "profile", "email", "offline_access"],
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
        },
      ],
    }),
  ],
});

export type Auth = typeof auth;
