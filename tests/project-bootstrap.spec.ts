import { expect, test } from "@playwright/test";

test("Project bootstrap works", async ({ page, baseURL }) => {
  // Display any logs to terminal (for debug)
  page.on("console", async (msg) => {
    console.log("Browser Log: ", msg);
  });

  // Go to http://localhost:3000/
  // This needs to come before the unit fetch request below so there isn't a cors issue
  await page.goto(baseURL ?? "/");

  // Ensure default unit doesn't exist
  await page.evaluate(
    async ({ baseURL }) => {
      const res = await fetch(baseURL + "/api/as-api/unit", { method: "DELETE" });
      const response = await res.json();
      if (!res.ok && response.error !== "The Unit does not exist") {
        throw Error("A possibly existing unit could not be cleaned up before running the test");
      }
    },
    { baseURL },
  );

  //
  // The Test
  //

  const timestamp = String(Date.now());
  const projectName = `playwright-${timestamp}`;

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
    baseURL + "/?\\?project=project-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+",
  );
  await expect(page).toHaveURL(regexp);

  // Click button
  await page.locator(`[aria-label="User"] button`).click();

  // Click text=Settings
  await page.locator("text=Settings").click();

  // Click div[role="button"]:has-text("Delete UnitDeletes the selected unit")
  await page.locator(`div[role="button"]:has-text("Delete UnitDeletes the selected unit")`).click();
  // Click button:has-text("Delete")
  await page.locator(`button:has-text("Delete")`).click();
});
