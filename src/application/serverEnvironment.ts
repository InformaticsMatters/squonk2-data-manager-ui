import { z } from "zod/mini";

// Empty counts as unset: `.env` derives these names from the deployment-facing ones, and a variable
// the environment never supplied expands to an empty string rather than going missing.
const variable = z.string().check(z.minLength(1, "is not set"));

const serverEnvironment = z.object({
  BETTER_AUTH_SECRET: variable,
  BETTER_AUTH_BASE_URL: variable,
  KEYCLOAK_ISSUER_URL: variable,
  KEYCLOAK_CLIENT_ID: variable,
  KEYCLOAK_CLIENT_SECRET: variable,
  DATA_MANAGER_API_SERVER: variable,
  ACCOUNT_SERVER_API_SERVER: variable,
});

/**
 * Refuses to start a server that is missing its runtime configuration, naming every absent variable
 * at once rather than leaving each to fail later as an unrelated error. This runs when the server
 * starts, not during `next build`: a published image is built without this configuration, which
 * the installation supplies to the running container.
 */
export const assertServerEnvironment = (env: Record<string, string | undefined>) => {
  const result = z.safeParse(serverEnvironment, env);
  if (!result.success) {
    throw new Error(
      `The server is missing required environment variables. Copy .env.local.example to .env.local for local development.\n${z.prettifyError(result.error)}`,
    );
  }
};
