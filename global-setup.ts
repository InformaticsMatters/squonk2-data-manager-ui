import type { FullConfig } from "@playwright/test";
import { chromium } from "@playwright/test";

const { BASE_URL, BASE_PATH = "", PW_USERNAME, PW_PASSWORD } = process.env;

const globalSetup = async (_config: FullConfig) => {
  const baseURL = "" + BASE_URL + BASE_PATH;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL, { timeout: 60000 });

  await page.screenshot({ path: "test-results/1.png" });

  await page.goto(baseURL + "/api/auth/login");

  await page.screenshot({ path: "test-results/2.png" });

  await page.type("input[name=username]", PW_USERNAME as string, { timeout: 60000 });
  await page.type("input[name=password]", PW_PASSWORD as string, { timeout: 60000 });

  await page.click(`input:has-text("Log In")`);

  await page.screenshot({ path: "test-results/3.png" });

  await page.waitForURL(baseURL, { timeout: 60000 });

  await page.screenshot({ path: "test-results/4.png" });

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });
  await browser.close();
};

export default globalSetup;
