import { test } from '@playwright/test';

test('datasets', async ({ baseURL, page }) => {
  await page.goto(baseURL + '/project');
});
