import { test as setup } from "@playwright/test";

import { login } from "./login";

const { BASE_URL, BASE_PATH = "" } = process.env;

setup("do login and logout", async ({ page }) => {
  const baseURL = "" + BASE_URL + BASE_PATH;

  await page.goto(baseURL);
  await page.getByRole("button").nth(1).click();
  await page.getByRole("link", { name: "Login" }).click();

  // On Keycloak

  await login(page);

  // Back on DMUI
  await page.waitForURL(BASE_URL + "/*");

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });

  await page.getByRole("button").nth(1).click();
  await page.getByRole("link", { name: "Logout" }).click();
});
