import type { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  const baseURL = 'http://localhost:3000/data-manager-ui';

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL, { timeout: 60000 });
  await page.click('button');
  await page.click('text=Login');

  await page.type('input[name=username]', process.env.PW_USERNAME as string);
  await page.type('input[name=password]', process.env.PW_PASSWORD as string);

  await page.click('input:has-text("Log In")');

  await page.waitForURL(baseURL);
  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: 'storageState.json' });
  await browser.close();
}

export default globalSetup;
