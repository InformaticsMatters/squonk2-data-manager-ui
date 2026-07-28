import {
  type OrganisationGetDefaultResponse,
  type OrganisationUnitsGetResponse,
  type ProductDmProjectTier,
  type ProductsGetResponse,
} from "@/api/account-server";

import { expect, test } from "@playwright/test";

const baseURL = new URL(process.env.BASE_URL as string);
baseURL.pathname = process.env.BASE_PATH ?? "/";

const AS_API = process.env.ACCOUNT_SERVER_API_SERVER as string;
const DM_API = process.env.DATA_MANAGER_API_SERVER as string;

test("Project bootstrap works", async ({ page, baseURL }) => {
  // Go to http://localhost:3000/
  // This needs to come before the unit fetch request below so there isn't a cors issue
  await page.goto(baseURL ?? "/");

  expect(baseURL).toBeDefined();

  const url = new URL(baseURL as string);
  // normalise the URL - sometimes we get a slash on the end, other times not
  const basePath = url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;

  url.pathname = basePath + "/api/auth/get-access-token";
  const tokenRes = await page.request.post(url.href, {
    data: { providerId: "keycloak" },
    headers: { Origin: url.origin },
  });
  const { accessToken } = (await tokenRes.json()) as { accessToken: string };
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  const defaultOrg: OrganisationGetDefaultResponse = await (
    await page.request.get(`${AS_API}/default/organisation`, { headers: authHeaders })
  ).json();

  // Ensure default unit and associated projects and products doesn't exist
  const units = (
    (await (
      await page.request.get(`${AS_API}/organisation/${defaultOrg.id}/unit`, {
        headers: authHeaders,
      })
    ).json()) as OrganisationUnitsGetResponse
  ).units;

  const personalUnit = units.find((unit) => unit.name === process.env.PW_USERNAME);

  if (personalUnit) {
    const products = (
      (await (
        await page.request.get(`${AS_API}/product`, { headers: authHeaders })
      ).json()) as ProductsGetResponse
    ).products;

    const productsToDelete = products
      .filter((product) => product.unit.id === personalUnit.id)
      .filter(
        (product): product is ProductDmProjectTier =>
          product.product.type === "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      );
    const productPromises = productsToDelete.map(async (product) => {
      if (product.claim?.id) {
        await page.request.delete(`${DM_API}/project/${product.claim.id}`, {
          headers: authHeaders,
        });
      }

      await page.request.delete(`${AS_API}/product/${product.product.id}`, {
        headers: authHeaders,
      });
    });
    await Promise.all(productPromises); // ensure that all products get deleted successfully

    const res = await page.request.delete(`${AS_API}/unit`, { headers: authHeaders });

    const responseText = await res.text();

    console.log("ok:", res.ok());
    console.log(responseText);

    const acceptableErrorMessages = ["You do not have a Personal Unit", "The Unit does not exist"];

    expect(!res.ok() && !acceptableErrorMessages.includes((await res.json()).error)).toBeFalsy();
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
  await page.getByLabel("Tier").click();

  // Click text=Evaluation
  await page.locator(`li:has-text("Evaluation")`).click();

  // Uncheck input[name="isPrivate"]
  // await page.locator(`input[name="isPrivate"]`).uncheck();

  // Click button:has-text("Create")
  await page.locator(`button:has-text("Create")`).click();
  // await page.locator(`button:has-text("Create")`).isDisabled();

  const regexp = new RegExp(
    baseURL + String.raw`/?\?project=project-[\w\d]+-[\w\d]+-[\w\d]+-[\w\d]+-[\w\d]+`,
    "u",
  );
  await expect(page).toHaveURL(regexp, { timeout: 30_000 });

  // Click [aria-label="Settings"]
  await page.locator(`[aria-label="Settings"]`).click();

  // Click text=Settings
  await page.getByText("Settings", { exact: true }).click();

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
