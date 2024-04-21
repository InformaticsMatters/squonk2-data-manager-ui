import { expect, test } from "@playwright/test";

test("dark mode works", async ({ page, baseURL }) => {
  baseURL ??= "";

  // Go to http://localhost:3000/
  await page.goto(baseURL);
  // Click [aria-label="User"] button
  await page.locator(`[aria-label="Account"] button`).click();
  // Check [aria-label="color-scheme-toggle"]
  await page.locator(`[aria-label="color-scheme-toggle"]`).check();

  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(18, 18, 18)");
});
