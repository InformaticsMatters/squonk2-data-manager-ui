import { expect, test } from "@playwright/test";

import { assertServerEnvironment } from "../../src/application/serverEnvironment";

const configured = {
  BETTER_AUTH_SECRET: "secret",
  BETTER_AUTH_BASE_URL: "https://an-installation.example",
  KEYCLOAK_ISSUER_URL: "https://an-installation.example/auth/realms/squonk",
  KEYCLOAK_CLIENT_ID: "data-manager-ui",
  KEYCLOAK_CLIENT_SECRET: "client-secret",
  DATA_MANAGER_API_SERVER: "https://an-installation.example/data-manager-api",
  ACCOUNT_SERVER_API_SERVER: "https://an-installation.example/account-server-api",
};

test.describe("server environment", () => {
  test("accepts a configured server", () => {
    expect(() => assertServerEnvironment(configured)).not.toThrow();
  });

  test("names every missing variable, counting an empty one as missing", () => {
    expect(() =>
      assertServerEnvironment({
        ...configured,
        KEYCLOAK_ISSUER_URL: "",
        BETTER_AUTH_SECRET: undefined,
      }),
    ).toThrow(/BETTER_AUTH_SECRET[\s\S]*KEYCLOAK_ISSUER_URL/u);
  });
});
