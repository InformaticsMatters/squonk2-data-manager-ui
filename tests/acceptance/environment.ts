const appPort = 4310;
const oidcPort = 4311;
const dataManagerPort = 4312;
const accountServerPort = 4313;
const controlPort = 4314;

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
  BETTER_AUTH_RATE_LIMIT_DISABLED: "true",
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
  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: "data-manager-ui-acceptance",
  NEXT_PUBLIC_KEYCLOAK_ISSUER_URL: oidcUrl,
  NODE_ENV: "production",
  TEST_PORT: String(appPort),
  VERCEL_BRANCH_URL: appUrl,
} satisfies NodeJS.ProcessEnv;

export const acceptanceUrls = {
  accountServer: acceptanceEnvironment.ACCOUNT_SERVER_API_SERVER,
  app: `${acceptanceEnvironment.BASE_URL}${acceptanceEnvironment.BASE_PATH}/`,
  control: acceptanceEnvironment.CONTROL_SERVER,
  dataManager: acceptanceEnvironment.DATA_MANAGER_API_SERVER,
  oidc: acceptanceEnvironment.KEYCLOAK_URL,
};
