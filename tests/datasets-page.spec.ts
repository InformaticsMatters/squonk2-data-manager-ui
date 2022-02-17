import { test } from '@playwright/test';

test.describe('datasets page', () => {
  test('loads', async ({ baseURL, page }) => {
    await page.goto(baseURL + '/datasets');
  });
});
