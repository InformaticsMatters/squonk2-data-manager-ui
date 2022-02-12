import { test } from '@playwright/test';

test('project', async ({ baseURL, page }) => {
  await page.goto(baseURL + '/project');
});
