import { expect, test } from "@playwright/test";

test("desk mode works", async ({ page, baseURL }) => {
  baseURL = baseURL ?? "";

  // Go to http://localhost:3000/
  await page.goto(baseURL);
  // Click [aria-label="User"] button
  await page.locator(`[aria-label="User"] button`).click();
  // Check [aria-label="color-scheme-toggle"]
  await page.locator(`[aria-label="color-scheme-toggle"]`).check();

  expect(page.locator("body")).toHaveCSS("background-color", "rgb(18, 18, 18)");
});
