import { test } from '@playwright/test';

test.describe('results page', () => {
  test('loads', async ({ baseURL, page }) => {
    await page.goto(baseURL + '/results');
  });
});
