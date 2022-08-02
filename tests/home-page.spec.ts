import { expect, test } from "@playwright/test";

const squonkLogo =
  "img[alt=\"Squonk \\(animal\\) logo with title text \\'Squonk\\' and subtitle \\'Data Manager\\'\"]";

test.describe("home page", () => {
  test("loads", async ({ baseURL, page }) => {
    await page.goto(baseURL + "/");
  });

  test("links work", async ({ page, baseURL }) => {
    baseURL = baseURL ?? "";

    // Go to http://localhost:3000/
    await page.goto(baseURL);

    // Click text=Documentation
    await page.locator("text=Documentation").click();
    // Click text=Concepts
    await page.locator("text=Concepts").click();
    await expect(page).toHaveURL(baseURL + "/docs/concepts");
    // Click img[alt="Squonk \(animal\) logo with title text \'Squonk\' and subtitle \'Data Manager\'"]
    await page.locator(squonkLogo).click();
    await expect(page).toHaveURL(baseURL);
    // Click text=Documentation
    await page.locator("text=Documentation").click();
    // Click text=Guided Tour
    await page.locator("text=Guided Tour").click();
    await expect(page).toHaveURL(baseURL + "/docs/guided-tour");
    // Click img[alt="Squonk \(animal\) logo with title text \'Squonk\' and subtitle \'Data Manager\'"]
    await page.locator(squonkLogo).click();
    await expect(page).toHaveURL(baseURL);
    // Click text=Documentation
    await page.locator("text=Documentation").click();
    // Click text=How To Guides
    await page.locator("text=How To Guides").click();
    await expect(page).toHaveURL(baseURL + "/docs/how-to");
    // Click img[alt="Squonk \(animal\) logo with title text \'Squonk\' and subtitle \'Data Manager\'"]
    await page.locator(squonkLogo).click();
    await expect(page).toHaveURL(baseURL);
    // Click text=Documentation
    await page.locator("text=Documentation").click();
    // Click text=Deployed jobs
    await page.locator("text=Deployed jobs").click();
    await expect(page).toHaveURL(baseURL + "/docs/jobs");
    // Click img[alt="Squonk \(animal\) logo with title text \'Squonk\' and subtitle \'Data Manager\'"]
    await page.locator(squonkLogo).click();
    await expect(page).toHaveURL(baseURL);
    // Click text=Documentation
    await page.locator("text=Documentation").click();
    // Click text=Developer docs
    await page.locator("text=Developer docs").click();
    await expect(page).toHaveURL(baseURL + "/docs/developer");
  });
});
