import { expect, test as setup } from "@playwright/test";

const { BASE_URL, BASE_PATH = "", PW_USERNAME, PW_PASSWORD, KEYCLOAK_URL } = process.env;

setup("do login and logout", async ({ page }) => {
  const baseURL = "" + BASE_URL + BASE_PATH;
  expect(PW_USERNAME).toBeDefined();
  expect(PW_PASSWORD).toBeDefined();

  await page.goto(baseURL);
  await page.getByRole("button").nth(1).click();
  await page.getByRole("link", { name: "Login" }).click();

  // On Keycloak

  await page.waitForURL(KEYCLOAK_URL + "/**");
  await page.getByLabel("Username or email").click();
  await page.getByLabel("Username or email").fill(PW_USERNAME as string);
  await page.getByLabel("Username or email").press("Tab");
  await page.getByLabel("Password").fill(PW_PASSWORD as string);
  await page.getByRole("button", { name: "Log In" }).click();

  // Back on DMUI
  await page.waitForURL(BASE_URL + "/*");

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });

  await page.getByRole("button").nth(1).click();
  await page.getByRole("link", { name: "Logout" }).click();
});
