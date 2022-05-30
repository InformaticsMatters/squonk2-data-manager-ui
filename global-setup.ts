import type { FullConfig } from "@playwright/test";
import { chromium } from "@playwright/test";

const { BASE_URL, BASE_PATH = "", PW_USERNAME, PW_PASSWORD } = process.env;

const globalSetup = async (_config: FullConfig) => {
  const baseURL = "" + BASE_URL + BASE_PATH;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL, { timeout: 60000 });
  await page.click("button");
  await page.click("text=Login");

  await page.type("input[name=username]", PW_USERNAME as string);
  await page.type("input[name=password]", PW_PASSWORD as string);

  await page.click(`input:has-text("Log In")`);

  await page.waitForURL(baseURL, { timeout: 60000 });
  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });
  await browser.close();
};

export default globalSetup;
