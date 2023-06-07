import type {
  OrganisationGetDefaultResponse,
  OrganisationUnitsGetResponse,
  ProductDmProjectTier,
  ProductsGetResponse,
} from "@squonk/account-server-client";

import { expect, test } from "@playwright/test";

const baseURL = new URL(process.env.BASE_URL as string);
baseURL.pathname = process.env.BASE_PATH ?? "/";

test("Project bootstrap works", async ({ page, baseURL }) => {
  // Go to http://localhost:3000/
  // This needs to come before the unit fetch request below so there isn't a cors issue
  await page.goto(baseURL ?? "/");

  expect(baseURL).toBeDefined();

  const url = new URL(baseURL as string);
  const basePath = url.pathname;

  url.pathname = basePath + "/api/as-api/organisation/default";

  const defaultOrg: OrganisationGetDefaultResponse = await (
    await page.request.get(new URL(url).href)
  ).json();

  // Ensure default unit and associated projects and products doesn't exist
  url.pathname = basePath + `/api/as-api/organisation/${defaultOrg.id}/unit`;
  const units = ((await (await page.request.get(url.href)).json()) as OrganisationUnitsGetResponse)
    .units;

  const personalUnit = units.find((unit) => unit.name === process.env.PW_USERNAME);

  if (personalUnit) {
    url.pathname = basePath + "/api/as-api/product";
    const products = ((await (await page.request.get(url.href)).json()) as ProductsGetResponse)
      .products;

    const productsToDelete = products
      .filter((product) => product.unit.id === personalUnit.id)
      .filter(
        (product): product is ProductDmProjectTier =>
          product.product.type === "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      );
    const productPromises = productsToDelete.map(async (product) => {
      url.pathname = basePath + `/api/dm-api/project/${product.claim?.id}`;
      page.request.delete(url.href);
      url.pathname = basePath + `/api/as-api/product/${product.product.id}`;
      page.request.delete(url.href);
    });
    await Promise.allSettled(productPromises);

    url.pathname = basePath + "/api/as-api/unit";
    const res = await page.request.delete(url.href);

    expect(!res.ok() && (await res.json()).error !== "The Unit does not exist").toBeFalsy();
  }

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

  await page.locator(`button:has-text("Create")`).isDisabled();

  await page.getByRole("alert", { name: "Project created" }).isVisible();

  const regexp = new RegExp(
    baseURL + "/?\\?project=project-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+-[\\w\\d]+",
  );
  await expect(page).toHaveURL(regexp, { timeout: 30_000 });

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

  await page.locator(`div[role="button"]:has-text("Delete Unit")`).click();
  // Click button:has-text("Delete")
  await page.locator(`button:has-text("Delete")`).click();
});