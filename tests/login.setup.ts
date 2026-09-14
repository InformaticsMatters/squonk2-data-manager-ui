import { test as setup } from "@playwright/test";

import { login } from "./login";

const { BASE_URL, BASE_PATH = "" } = process.env;

/**
 * Live evidence that a real Keycloak still signs this deployment in and out. It saves no storage
 * state: the authenticated journeys that reused one drove the removed selected-project and Settings
 * UI, and what replaced them is proven deterministically in `tests/acceptance`.
 */
setup("do login and logout", async ({ page }) => {
  const baseURL = "" + BASE_URL + BASE_PATH;

  await page.goto(baseURL);
  await page.getByRole("button").nth(1).click();
  await page.getByRole("button", { name: "Login" }).click();

  // On Keycloak

  await login(page);

  // Back on DMUI
  await page.waitForURL(BASE_URL + "/*");

  await page.getByRole("button").nth(1).click();
  await page.getByRole("button", { name: "Logout" }).click();
});
