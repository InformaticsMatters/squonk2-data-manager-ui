import { expect, test } from "@playwright/test";

test("test", async ({ page, baseURL }) => {
  const timestamp = String(Date.now());
  const projectName = `playwright-${timestamp}`;

  // Go to http://localhost:3000/
  await page.goto(baseURL ?? "/");

  // Click input[name="projectName"]
  await page.locator(`input[name="projectName"]`).click();

  // Fill input[name="projectName"]
  await page.locator(`input[name="projectName"]`).fill(projectName);

  // Click div[role="button"]:has-text("")
  await page.locator(`div[role="button"]:has-text("")`).click();

  // Click text=Evaluation
  await page.locator("text=Evaluation").click();

  // Uncheck input[name="isPrivate"]
  await page.locator(`input[name="isPrivate"]`).uncheck();

  // Click button:has-text("Create")
  await page.locator(`button:has-text("Create")`).click();

  const regexp = new RegExp(
    baseURL + "/\\?project=project-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+",
  );
  await expect(page).toHaveURL(regexp);

  // Click button
  await page.locator("button").click();

  // Click text=Settings
  await page.locator("text=Settings").click();

  // Click [aria-label="Delete selected unit"] >> nth=1
  await page.locator(`[aria-label="Delete selected unit"]`).nth(1).click();

  // Click button:has-text("Delete")
  await page.locator(`button:has-text("Delete")`).click();
});
