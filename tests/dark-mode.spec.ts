import { expect, test } from "@playwright/test";

test("desk mode works", async ({ page, baseURL }) => {
  baseURL = baseURL ?? "";

  // Go to http://localhost:3000/
  await page.goto(baseURL);

  // Click [aria-label="User"] button
  await page.locator(`[aria-label="User"] button`).click();

  // Click text=Settings
  await page.locator("text=Settings").click();

  // Check [aria-label="color-scheme-toggle"]
  await page.locator(`[aria-label="color-scheme-toggle"]`).check();

  // Click #user-settings-title button
  await page.locator("#user-settings-title button").click();

  expect(page.locator("body")).toHaveCSS("background-color", "rgb(18, 18, 18)");
});
