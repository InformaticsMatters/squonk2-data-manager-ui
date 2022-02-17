import { test } from '@playwright/test';

test.describe('home page', () => {
  test('loads', async ({ baseURL, page }) => {
    await page.goto(baseURL + '/');
  });
});
