// General script that will fill in the Keycloak Login form

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const { PW_USERNAME, PW_PASSWORD, KEYCLOAK_URL } = process.env;

export const login = async (page: Page) => {
  expect(PW_USERNAME).toBeDefined();
  expect(PW_PASSWORD).toBeDefined();

  // We aren't logged in so ensure we're on Keycloak
  await page.waitForURL(KEYCLOAK_URL + "/**");
  await page.getByLabel("Username or email").click();
  await page.getByLabel("Username or email").fill(PW_USERNAME as string);
  await page.getByLabel("Username or email").press("Tab");
  await page.getByLabel("Password").fill(PW_PASSWORD as string);
  await page.getByRole("button", { name: "Log In" }).click();
};
