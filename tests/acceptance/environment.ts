const appPort = Number(process.env.ACCEPTANCE_PORT ?? 4310);
const oidcPort = appPort + 1;
const dataManagerPort = appPort + 2;
const accountServerPort = appPort + 3;
const controlPort = appPort + 4;

const accountServerUrl = `http://127.0.0.1:${accountServerPort}`;
const appUrl = `http://127.0.0.1:${appPort}`;
const basePath = "/data-manager-ui";
const controlUrl = `http://127.0.0.1:${controlPort}`;
const dataManagerUrl = `http://127.0.0.1:${dataManagerPort}`;
const oidcUrl = `http://127.0.0.1:${oidcPort}`;

export const acceptanceEnvironment = {
  ...process.env,
  ACCOUNT_SERVER_API_SERVER: accountServerUrl,
  BASE_PATH: basePath,
  BASE_URL: appUrl,
  BETTER_AUTH_BASE_URL: appUrl,
  // Every worker signs the same identity in through the OAuth callback dozens of times in as many
  // seconds, and a callback reached by redirect carries no forwarded address to tell them apart, so
  // one shared counter would start answering `429` purely because the suite is long.
  BETTER_AUTH_RATE_LIMIT_ENABLED: "false",
  BETTER_AUTH_SECRET: "acceptance-only-secret-at-least-thirty-two-characters",
  CONTROL_SERVER: controlUrl,
  DATA_MANAGER_API_SERVER: dataManagerUrl,
  DEPICT_API_SERVER: `${dataManagerUrl}/depict`,
  DONT_USE_STANDALONE_OUTPUT: "true",
  KEYCLOAK_CLIENT_ID: "data-manager-ui-acceptance",
  KEYCLOAK_CLIENT_SECRET: "acceptance-client-secret",
  KEYCLOAK_ISSUER_URL: oidcUrl,
  KEYCLOAK_URL: oidcUrl,
  NEXT_PUBLIC_ACCOUNT_SERVER_API_SERVER: accountServerUrl,
  NEXT_PUBLIC_BASE_PATH: basePath,
  NEXT_PUBLIC_DATA_MANAGER_API_SERVER: dataManagerUrl,
  NEXT_PUBLIC_DEPICT_API_SERVER: `${dataManagerUrl}/depict`,
  NEXT_PUBLIC_PROJECT_CREATION_TIMEOUT_MS: "750",
  NODE_ENV: "production",
  TEST_PORT: String(appPort),
  VERCEL_BRANCH_URL: appUrl,
} satisfies NodeJS.ProcessEnv;

const {
  KEYCLOAK_CLIENT_ID: _keycloakClientId,
  KEYCLOAK_CLIENT_SECRET: _keycloakClientSecret,
  KEYCLOAK_ISSUER_URL: _keycloakIssuerUrl,
  KEYCLOAK_URL: _keycloakUrl,
  ...acceptanceBuildEnvironment
} = acceptanceEnvironment;

export { acceptanceBuildEnvironment };

export const acceptanceUrls = {
  accountServer: acceptanceEnvironment.ACCOUNT_SERVER_API_SERVER,
  app: `${acceptanceEnvironment.BASE_URL}${acceptanceEnvironment.BASE_PATH}/`,
  control: acceptanceEnvironment.CONTROL_SERVER,
  dataManager: acceptanceEnvironment.DATA_MANAGER_API_SERVER,
  oidc: acceptanceEnvironment.KEYCLOAK_URL,
};
