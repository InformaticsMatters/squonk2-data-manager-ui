const appPort = 4310;
const oidcPort = 4311;
const dataManagerPort = 4312;
const accountServerPort = 4313;

export const acceptanceEnvironment = {
  ...process.env,
  ACCOUNT_SERVER_API_SERVER: `http://127.0.0.1:${accountServerPort}`,
  BASE_PATH: "/data-manager-ui",
  BASE_URL: `http://127.0.0.1:${appPort}`,
  BETTER_AUTH_BASE_URL: `http://127.0.0.1:${appPort}`,
  BETTER_AUTH_SECRET: "acceptance-only-secret-at-least-thirty-two-characters",
  DATA_MANAGER_API_SERVER: `http://127.0.0.1:${dataManagerPort}`,
  DEPICT_API_SERVER: `http://127.0.0.1:${dataManagerPort}/depict`,
  DONT_USE_STANDALONE_OUTPUT: "true",
  KEYCLOAK_CLIENT_ID: "data-manager-ui-acceptance",
  KEYCLOAK_CLIENT_SECRET: "acceptance-client-secret",
  KEYCLOAK_URL: `http://127.0.0.1:${oidcPort}`,
  NODE_ENV: "production",
  TEST_PORT: String(appPort),
  VERCEL_BRANCH_URL: `http://127.0.0.1:${appPort}`,
} satisfies NodeJS.ProcessEnv;

export const acceptanceUrls = {
  accountServer: acceptanceEnvironment.ACCOUNT_SERVER_API_SERVER,
  app: `${acceptanceEnvironment.BASE_URL}${acceptanceEnvironment.BASE_PATH}/`,
  dataManager: acceptanceEnvironment.DATA_MANAGER_API_SERVER,
  oidc: acceptanceEnvironment.KEYCLOAK_URL,
};
