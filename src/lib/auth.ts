import { captureException } from "@sentry/nextjs";
import { betterAuth } from "better-auth";
import { genericOAuth, keycloak } from "better-auth/plugins";
import { jwtDecode } from "jwt-decode";

import { withBasePath } from "../utils/app/basePath";

// `new URL` throws on an undefined base, and this module is imported while `next build` collects
// page data — a build that deliberately carries no runtime configuration, since the image is built
// once and deployed against whichever base URL the environment sets. Resolving to undefined when
// the base is absent keeps the module importable at build time; every deployment sets the variable,
// so the values handed to Keycloak in a running instance are unchanged. Better Auth resolves its
// own relative URLs against a base that stops at the auth handler, so both addresses are given to
// it absolute, carrying the application's base path.
const absoluteAppUrl = (path: string) =>
  process.env.BETTER_AUTH_BASE_URL
    ? new URL(withBasePath(path), process.env.BETTER_AUTH_BASE_URL).href
    : undefined;

const keycloakRedirectURI = absoluteAppUrl("/api/auth/callback/keycloak");

// Where Keycloak sends the browser once it has ended its own session. Keycloak only honours it
// when the client registers it as a valid post-logout redirect URI.
const keycloakPostLogoutRedirectURI = absoluteAppUrl("/");

// No database config → better-auth defaults to memory adapter + cookie cache (stateless sessions)
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_BASE_URL,
  basePath: "/api/auth",

  // Keycloak owns every one of these: they are copied from its tokens on each sign-in, and
  // `input: true` is what admits them, since better-auth applies its input rules to a provider
  // profile as much as to a request body and drops a field the schema will not take input for.
  // Nothing else may write them — see `disabledPaths` below.
  user: {
    additionalFields: {
      preferred_username: { type: "string", required: false },
      given_name: { type: "string", required: false },
      family_name: { type: "string", required: false },
      realm_access: { type: "string", required: false }, // JSON string
    },
  },

  // The user record is a cache of what Keycloak said, so the endpoint that would let a caller
  // rewrite it — their realm roles included — is not part of this application's surface. The roles
  // decide only what the UI offers (ADR 0003), but nothing here needs them editable either.
  disabledPaths: ["/update-user"],

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
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
            issuer: process.env.KEYCLOAK_ISSUER_URL as string,
            redirectURI: keycloakRedirectURI,
            // Sending `id_token_hint` is what stops Keycloak asking the caller to confirm the
            // logout on a page themed by the realm rather than by us; better-auth adds the hint
            // to this address, which it discovers as `end_session_endpoint`.
            postLogoutRedirectURI: keycloakPostLogoutRedirectURI,
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
              // Better Auth keys the account on the OIDC subject, which it reads from `sub`; `id`
              // is what it would use for a provider that publishes no discovery document.
              sub: decoded.sub as string,
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
          mapProfileToUser: (profile) => ({
            preferred_username: profile.preferred_username,
            given_name: profile.given_name,
            family_name: profile.family_name,
            realm_access: profile.realm_access,
          }),
        },
      ],
    }),
  ],
});

export type Auth = typeof auth;
