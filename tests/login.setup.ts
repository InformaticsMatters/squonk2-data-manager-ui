import { expect, test as setup } from "@playwright/test";

const { BASE_URL, BASE_PATH = "", PW_USERNAME, PW_PASSWORD } = process.env;

setup("do login", async ({ page }) => {
  const baseURL = "" + BASE_URL + BASE_PATH;

  await page.goto(baseURL, { timeout: 60000 });

  await page.goto(baseURL + "/api/auth/login");

  expect(PW_USERNAME).toBeDefined();
  expect(PW_PASSWORD).toBeDefined();

  await page.type("input[name=username]", PW_USERNAME as string);
  await page.type("input[name=password]", PW_PASSWORD as string);

  await page.click(`input:has-text("Log In")`);

  await page.waitForURL(baseURL, { timeout: 60000 });

  await page.getByRole("button").nth(1).click();

  expect(page.getByText(`${PW_USERNAME} / Logout`).textContent()).toBeDefined();

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });
});
