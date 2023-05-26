import { test } from "@playwright/test";

import { login } from "./login";

const { BASE_URL, BASE_PATH = "" } = process.env;

test.describe("home page", () => {
  test("loads", async ({ baseURL, page }) => {
    await page.goto(baseURL + "/");
    await page.getByRole("heading", { name: "Documentation" }).waitFor();
  });
});

test("do login via results page", async ({ page }) => {
  const baseURL = "" + BASE_URL + BASE_PATH;

  await page.goto(baseURL);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Results" })
    .click();

  // We aren't logged in so ensure we redirect to Keycloak
  await login(page);

  // We should return to the page we clicked on
  await page.waitForURL(BASE_URL + "/results");
  await page.locator("label").filter({ hasText: "Filter Results" }).waitFor();
});

test("do login via datasets page", async ({ page }) => {
  const baseURL = "" + BASE_URL + BASE_PATH;

  await page.goto(baseURL);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Datasets" })
    .click();

  // We aren't logged in so ensure we redirect to Keycloak
  await login(page);

  // We should return to the page we clicked on
  await page.waitForURL(BASE_URL + "/datasets");
  await page.getByRole("heading", { name: "Datasets" }).waitFor();
});

test("do login via executions page", async ({ page }) => {
  const baseURL = "" + BASE_URL + BASE_PATH;

  await page.goto(baseURL);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Executions" })
    .click();

  // We aren't logged in so ensure we redirect to Keycloak
  await login(page);

  // We should return to the page we clicked on
  await page.waitForURL(BASE_URL + "/executions");
  await page.locator("label").filter({ hasText: "Filter Executions" }).waitFor();
});

test("do login via project page", async ({ page }) => {
  const baseURL = "" + BASE_URL + BASE_PATH;

  await page.goto(baseURL);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Project" })
    .click();

  // We aren't logged in so ensure we redirect to Keycloak
  await login(page);

  // We should return to the page we clicked on
  await page.waitForURL(BASE_URL + "/project");
  await page.getByRole("heading", { name: "Select a project to view" }).waitFor();
});
