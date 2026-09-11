// General script that will fill in the Keycloak Login form

import { expect, type Page } from "@playwright/test";

import { liveUser, passwordFor } from "./liveEnvironment";

/**
 * Fills in the Keycloak login form as one identity, defaulting to the identity the live suites are
 * pinned to. Only its password is read from the environment.
 */
export const login = async (
  page: Page,
  identity: { passwordVariable: string; username: string } = liveUser,
) => {
  const password = passwordFor(identity);
  expect(
    password,
    `${identity.username} needs ${identity.passwordVariable} to be set`,
  ).toBeDefined();

  // We aren't logged in so ensure we're on Keycloak
  await page.waitForURL(process.env.KEYCLOAK_URL + "/**");
  await page.getByLabel("Username or email").click();
  await page.getByLabel("Username or email").fill(identity.username);
  await page.getByLabel("Password", { exact: true }).fill(password as string);
  //                                       For keycloak ~v23
  //                                                 For keycloak ~v14
  await page.getByRole("button", { name: /(Sign In)|(Log In)/u }).click();
};
