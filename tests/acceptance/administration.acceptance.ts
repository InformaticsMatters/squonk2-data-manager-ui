import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

const subjectFor = (testInfo: TestInfo) => `acceptance-worker-${testInfo.parallelIndex}`;

test.beforeEach(async ({ request }, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}`);
});

const login = async (page: Page, path: string, testInfo: TestInfo) => {
  await page.route(`${acceptanceUrls.app}**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-for": `10.1.${testInfo.parallelIndex + 1}.${testInfo.line}`,
      },
    });
  });
  await page.goto(path);
  await page.getByLabel("Username").fill(subjectFor(testInfo));
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();
};

test("Administration entry and task navigation are canonical and stable", async ({
  page,
}, testInfo) => {
  await login(page, "administration", testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/organisation-access`);
  await expect(page.getByRole("heading", { name: "Administration", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Administration tasks" }).getByRole("link"),
  ).toHaveText(["Organisation & access", "Subscriptions", "Charges", "Usage & inventory"]);

  await page.getByRole("link", { name: "Subscriptions" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/subscriptions`);
  await expect(page.getByText(/No subscriptions are available/u)).toBeVisible();

  await page.getByRole("link", { name: "Charges" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges`);
  await expect(page.getByText("Partner Organisation", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Usage & inventory" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/usage-inventory`);
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges`);
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/usage-inventory`);
});

test("direct resources retain ancestry through refresh", async ({ page }, testInfo) => {
  const path = `administration/organisation-access/units/${fixtureIds.unit}`;
  await login(page, path, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Acceptance Organisation", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByText(fixtureIds.unit, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();
});

test("malformed resources retain their Administration task", async ({ page }, testInfo) => {
  await login(page, "administration/charges/units/not-a-unit", testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges/units/not-a-unit`);
  await expect(page.getByRole("navigation", { name: "Administration tasks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Charges", level: 2 })).toBeVisible();
  await expect(
    page.getByText("The requested Administration resource was not found."),
  ).toBeVisible();
});

test("missing opaque resources do not render as real subscriptions", async ({ page }, testInfo) => {
  await login(page, `administration/subscriptions/${fixtureIds.product}`, testInfo);

  await expect(page.getByRole("navigation", { name: "Administration tasks" })).toBeVisible();
  await expect(
    page.getByText("This resource is unavailable or you no longer have access."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Subscription", level: 3 })).not.toBeVisible();
});

test("recoverable failures retain the task and retry in place", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/product-failure`);
  await login(page, "administration/subscriptions", testInfo);

  await expect(page.getByRole("navigation", { name: "Administration tasks" })).toBeVisible();
  await expect(
    page.getByText("Administration data could not be loaded. Retry this task."),
  ).toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/product-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText(/No subscriptions are available/u)).toBeVisible();
});
