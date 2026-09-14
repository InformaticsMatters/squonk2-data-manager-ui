import { expect, test } from "@playwright/test";

test("dark mode works", async ({ page, baseURL }) => {
  baseURL ??= "";

  // Go to http://localhost:3000/
  await page.goto(baseURL);
  // Click [aria-label="User"] button

  await page.getByRole("button", { name: "Account" }).click();
  // The colour scheme is three exclusive icon buttons in the account menu, not a radio group.
  await page
    .getByRole("region", { name: "Account menu" })
    .getByRole("button", { name: "Dark" })
    .click();

  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(18, 18, 18)");
});
