import { test } from "@playwright/test";

import { login } from "./login";

/**
 * Live-service smoke evidence. The same outcomes are proven deterministically against fixtures in
 * `tests/acceptance/application-shell.acceptance.ts`; this suite exists only to show that a real
 * Keycloak, Data Manager, and Account Server still carry them, and is not a merge gate.
 */

test("loads", async ({ baseURL, page }) => {
  await page.goto(baseURL as string);
  await page.getByRole("heading", { name: "Documentation" }).waitFor();
});

test("do login via datasets page", async ({ page, baseURL }) => {
  await page.goto(baseURL as string);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Datasets" })
    .click();

  // We aren't logged in so ensure we redirect to Keycloak
  await login(page);

  // We should return to the page we clicked on
  await page.waitForURL("**/datasets");
  await page.getByRole("heading", { name: "Datasets" }).waitFor();
});

test("do login via project index", async ({ page, baseURL }) => {
  await page.goto(baseURL as string);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Projects" })
    .click();

  await login(page);

  // Project opens its index; a project is entered explicitly rather than restored.
  await page.waitForURL("**/projects");
  await page.getByRole("heading", { name: "Projects" }).waitFor();
});

test("do login via administration", async ({ page, baseURL }) => {
  await page.goto(baseURL as string);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Administration" })
    .click();

  await login(page);

  // Administration always lands on Organisation & access rather than a remembered task.
  await page.waitForURL("**/administration/organisation-access");
  await page.getByRole("heading", { name: "Organisation & access" }).waitFor();
});
