import { test } from '@playwright/test';

test.describe('executions page', () => {
  test('loads', async ({ baseURL, page }) => {
    await page.goto(baseURL + '/executions');
  });
});
