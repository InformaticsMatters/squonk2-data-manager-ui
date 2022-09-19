import type {
  OrganisationGetDefaultResponse,
  OrganisationUnitsGetResponse,
  ProductDmProjectTier,
  ProductsGetResponse,
} from "@squonk/account-server-client";

import { expect, test } from "@playwright/test";

test("Project bootstrap works", async ({ page, baseURL }) => {
  // Display any logs to terminal (for debug)
  page.on("console", async (msg) => {
    console.log("Browser Log: ", msg);
  });

  // Go to http://localhost:3000/
  // This needs to come before the unit fetch request below so there isn't a cors issue
  await page.goto(baseURL ?? "/");

  // Ensure default unit and associated projects and products doesn't exist
  await page.evaluate(
    async ({ baseURL, username }) => {
      // This need to be a pure function
      const defaultOrgRes = await fetch(baseURL + "/api/as-api/organisation/default");
      const defaultOrg: OrganisationGetDefaultResponse = await defaultOrgRes.json();
      const orgRes = await fetch(baseURL + `/api/as-api/organisation/${defaultOrg.id}/unit`);
      const units = ((await orgRes.json()) as OrganisationUnitsGetResponse).units;

      const personalUnit = units.find((unit) => unit.name === username);

      if (personalUnit) {
        const productRes = await fetch(baseURL + "/api/as-api/product");
        const products = ((await productRes.json()) as ProductsGetResponse).products;

        const productsToDelete = products
          .filter((product) => product.unit.id === personalUnit.id)
          .filter(
            (product): product is ProductDmProjectTier =>
              product.product.type === "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
          );
        const productPromises = productsToDelete.map(async (product) => {
          await fetch(baseURL + `/api/dm-api/project/${product.claim?.id}`, { method: "DELETE" });
          await fetch(baseURL + `/api/as-api/product/${product.product.id}`, { method: "DELETE" });
        });
        await Promise.allSettled(productPromises);

        const res = await fetch(baseURL + "/api/as-api/unit", { method: "DELETE" });
        const response = await res.json();
        if (!res.ok && response.error !== "The Unit does not exist") {
          console.log(response.error);
          throw Error("An existing unit could not be cleaned up before running the test");
        }
      }
    },
    { baseURL, username: process.env.PW_USERNAME },
  );

  //
  // The Test
  //

  await page.reload();

  const timestamp = String(Date.now());
  const projectName = `playwright-${timestamp}`;

  // Click input[name="projectName"]
  await page.locator(`input[name="projectName"]`).click();

  // Fill input[name="projectName"]
  await page.locator(`input[name="projectName"]`).fill(projectName);

  // Click div[role="button"]:has-text("")
  await page.locator(`div[role="button"]:has-text("")`).click();

  // Click text=Evaluation
  await page.locator(`li:has-text("Evaluation")`).click();

  // Uncheck input[name="isPrivate"]
  await page.locator(`input[name="isPrivate"]`).uncheck();

  // Click button:has-text("Create")
  await page.locator(`button:has-text("Create")`).click();

  const regexp = new RegExp(
    baseURL + "/?\\?project=project-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+",
  );
  await expect(page).toHaveURL(regexp);

  // Click [aria-label="Settings"]
  await page.locator(`[aria-label="Settings"]`).click();

  // Click text=Settings
  await page.locator("text=Settings").click();

  // Click [aria-label="Delete Project"] button
  await page.locator(`[aria-label="Delete Project"] button`).click();
  // Click button:has-text("Delete")
  await page.locator(`button:has-text("Delete")`).click();
  // Click div[role="button"]:has-text("Delete UnitDeletes the selected unit")

  // Wait for the modal to close to imply the unit can now be deleted
  await page.locator(`h2:has-text("Delete Unit")`).waitFor({ state: "detached" });

  await page.locator(`div[role="button"]:has-text("Delete UnitDeletes the selected unit")`).click();
  // Click button:has-text("Delete")
  await page.locator(`button:has-text("Delete")`).click();
});
