import { test } from "@playwright/test";

test.describe("project page", () => {
  test("loads", async ({ baseURL, page }) => {
    await page.goto(baseURL + "/project");
  });
});
