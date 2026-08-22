import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

/**
 * The unit half of the Administration workspace: one unit, its four sections, and the
 * subscriptions that live inside it. The organisation half has its own file.
 */

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

const rail = (page: Page) => page.getByRole("navigation", { name: "Administration" });
const unitTabs = (page: Page) => page.getByRole("navigation", { name: "Unit sections" });
const unitPath = `administration/units/${fixtureIds.unit}`;

test("a unit keeps its identity across all four sections", async ({ page }, testInfo) => {
  await login(page, `${unitPath}/access`, testInfo);

  await expect(unitTabs(page).getByRole("link")).toHaveText([
    "Access",
    "Subscriptions",
    "Charges",
    "Usage & Inventory",
  ]);
  await expect(page.getByRole("heading", { level: 2, name: "Acceptance Unit" })).toBeVisible();
  await expect(page.getByText("Acceptance Organisation", { exact: true }).first()).toBeVisible();

  // Three tab clicks, and the unit is never reselected.
  await unitTabs(page).getByRole("link", { name: "Subscriptions" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/subscriptions`);
  await expect(page.getByRole("heading", { level: 2, name: "Acceptance Unit" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dataset Storage" })).toBeVisible();

  await unitTabs(page).getByRole("link", { name: "Charges" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/charges`);
  await expect(page.getByRole("heading", { name: /Total charges/u })).toBeVisible();

  await unitTabs(page).getByRole("link", { name: "Usage & Inventory" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/usage`);
  await expect(page.getByRole("button", { name: "By project" })).toBeVisible();

  // Browser history restores exactly the prior state at every step.
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/charges`);
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/subscriptions`);
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/charges`);
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/usage`);
});

test("a bare unit URL lands on Access", async ({ page }, testInfo) => {
  await login(page, unitPath, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/access`);
  await expect(page.getByLabel("Unit name")).toHaveValue("Acceptance Unit");
});

test("switching unit from the rail never returns to an index", async ({ page }, testInfo) => {
  await login(page, `${unitPath}/usage`, testInfo);

  await rail(page)
    .getByRole("link", { name: /Screening Unit/u })
    .click();
  // The rail never left, so the next unit is one click and lands on its own Access section.
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/units/${fixtureIds.otherUnit}/access`,
  );
  await expect(page.getByRole("heading", { level: 2, name: "Screening Unit" })).toBeVisible();
});

test("a unit's lifecycle lives in one Access section", async ({ page }, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, `${unitPath}/access`, testInfo);

  await page.getByLabel("Unit name").fill("Renamed Unit");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.getByText("Unit renamed")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Unit name")).toHaveValue("Renamed Unit");

  await page.getByRole("combobox", { name: "Default project privacy" }).click();
  await page.getByRole("option", { exact: true, name: "Default Public" }).click();
  await expect(page.getByText("Unit default privacy updated")).toBeVisible();
  await expect(page.getByText(/New projects in this unit start public/u)).toBeVisible();

  const colleague = `${subject}-observer`;
  await page.getByLabel(`Remove ${colleague}`).click();
  await expect(page.getByText(`Member ${colleague} removed`)).toBeVisible();
  await page.getByRole("combobox", { name: "Unit members" }).click();
  await page.getByRole("option", { exact: true, name: colleague }).click();
  await expect(page.getByText(`Member ${colleague} added`)).toBeVisible();

  // The owner is displayed without a control that would ask for a change the resource refuses.
  await expect(page.getByLabel(`Remove ${subject}`, { exact: true })).toHaveCount(0);
  // Membership is flat: nothing here offers a role the unit has no notion of.
  await expect(page.getByRole("combobox", { name: /role/iu })).toHaveCount(0);
});

test("a personal unit says what cannot be changed rather than hiding it", async ({
  page,
}, testInfo) => {
  await login(page, `administration/units/${fixtureIds.personalUnit}/access`, testInfo);

  await expect(page.getByText("Personal unit").first()).toBeVisible();
  await expect(page.getByLabel("Unit name")).toBeDisabled();
  await expect(
    page.getByText("Personal units cannot be renamed or reconfigured.").first(),
  ).toBeVisible();
  // The member field is present and disabled, so the caller learns the rule rather than wondering
  // where the control went.
  await expect(page.getByRole("combobox", { name: "Unit members" })).toBeDisabled();
  await expect(page.getByText("Members of a personal unit cannot be changed.")).toBeVisible();
});

test("a unit's subscriptions are listed and created inside it", async ({ page }, testInfo) => {
  await login(page, `administration/units/${fixtureIds.otherUnit}/subscriptions`, testInfo);

  // The unit's own product read answers, rather than a global list filtered down.
  await expect(page.getByRole("link", { name: "Unclaimed Project Tier" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dataset Storage" })).toHaveCount(0);

  // Creation never asks who owns it: the unit in the address bar does.
  await page.getByRole("button", { name: /Create dataset storage subscription/u }).click();
  await page.getByLabel("Subscription name").fill("Screening Storage");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Subscription created")).toBeVisible();
  await expect(page.getByRole("link", { name: "Screening Storage" })).toBeVisible();
});

test("a subscription is managed inside the unit that pays for it", async ({ page }, testInfo) => {
  await login(page, `${unitPath}/subscriptions`, testInfo);

  await page.getByRole("link", { name: "Dataset Storage" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${unitPath}/subscriptions/${fixtureIds.storageProduct}`,
  );
  // The unit is still on screen, with Subscriptions still the current unit section.
  await expect(page.getByRole("heading", { level: 2, name: "Acceptance Unit" })).toBeVisible();
  await expect(page.getByText(fixtureIds.storageProduct, { exact: true })).toBeVisible();

  const subscriptionTabs = page.getByRole("navigation", { name: "Subscription sections" });
  await expect(subscriptionTabs.getByRole("link")).toHaveText(["Subscription", "Charges"]);

  await page.getByLabel("Allowance").fill("2000");
  await page.getByRole("button", { name: "Adjust subscription" }).click();
  await expect(page.getByText("Subscription adjusted")).toBeVisible();
  await page.reload();
  await expect(page.getByText("0 of 2000 coins used")).toBeVisible();

  await subscriptionTabs.getByRole("link", { name: "Charges" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${unitPath}/subscriptions/${fixtureIds.storageProduct}/charges`,
  );
});

test("a subscription's charge ledger is its own route with its own period", async ({
  page,
}, testInfo) => {
  const path = `${unitPath}/subscriptions/${fixtureIds.product}/charges`;
  await login(page, path, testInfo);

  await expect(page.getByRole("heading", { name: "Processing charges" })).toBeVisible();
  await page.getByLabel("Billing cycle").click();
  await page.getByRole("option", { exact: true, name: "1 billing cycle ago" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}?billing-cycle=-1`);
  await page.reload();
  await expect(page.getByLabel("Billing cycle")).toHaveText("1 billing cycle ago");
});

test("a subscription identifier alone resolves to its canonical address", async ({
  page,
}, testInfo) => {
  await login(page, `administration/subscriptions/${fixtureIds.product}`, testInfo);

  // The convenience entry renders nothing of its own: it learns the unit and replaces itself.
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${unitPath}/subscriptions/${fixtureIds.product}`,
  );
  await expect(page.getByRole("heading", { level: 2, name: "Acceptance Unit" })).toBeVisible();
  await expect(page.getByText(fixtureIds.product, { exact: true })).toBeVisible();
});

test("a unit's charge ledger reaches its subscriptions and keeps the period", async ({
  page,
}, testInfo) => {
  await login(page, `${unitPath}/charges?billing-cycle=-2`, testInfo);

  await expect(page.getByRole("heading", { name: /Total charges/u })).toBeVisible();
  await page.getByRole("link", { name: "Project Subscription" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}${unitPath}/subscriptions/${fixtureIds.product}/charges?billing-cycle=-2`,
  );
});

test("a unit's usage report pivots between its users and its projects", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, `${unitPath}/usage`, testInfo);

  await expect(page.getByRole("row").filter({ hasText: subject }).first()).toBeVisible();
  await page.getByRole("button", { name: "By project" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Acceptance Project" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Manage project" }).first()).toBeVisible();

  // The report renders no read-only copy of what Access owns one tab away.
  await expect(page.getByText("This report is read-only")).toHaveCount(0);
});

test("a refused unit read replaces the page rather than degrading it", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/addressed-read-failure?status=403`,
  );
  await login(page, `${unitPath}/access`, testInfo);

  // A unit the caller cannot read genuinely has no content, so nothing of it survives — while the
  // workspace it sits in does, and the rail is still there to leave through.
  await expect(
    page.getByText("You do not have access to this Administration resource."),
  ).toBeVisible();
  await expect(page.getByLabel("Unit name")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Administration", level: 1 })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/access`);
});

test("a transient unit read retries in place without changing scope", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/addressed-read-failure?status=503`,
  );
  await login(page, `${unitPath}/access`, testInfo);

  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/addressed-read-failure`);
  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByLabel("Unit name")).toHaveValue("Acceptance Unit");
  await expect(page).toHaveURL(`${acceptanceUrls.app}${unitPath}/access`);
});

test("a unit outside the organisation in effect adopts the organisation that holds it", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, `administration/units/${fixtureIds.personalUnit}/access`, testInfo);

  // The caller's own grouped unit index names the parent, so identity and content agree.
  await expect(page.getByRole("heading", { level: 2, name: subject })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change organisation" })).toContainText(
    "Default Organisation",
  );
});

test("a unit whose organisation cannot be determined still opens", async ({ page }, testInfo) => {
  await login(page, `administration/units/${fixtureIds.unlistedUnit}/access`, testInfo);

  // Readable through its own resource while the caller's index never groups it: it keeps its
  // identity and loses nothing but its ancestry.
  await expect(page.getByRole("heading", { level: 2, name: "Unlisted Unit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change organisation" })).toContainText(
    "Acceptance Organisation",
  );
});

test("deleting a unit returns to the organisation that held it", async ({ page }, testInfo) => {
  await login(page, `administration/units/${fixtureIds.otherUnit}/access`, testInfo);

  await page.getByRole("button", { name: "Delete unit" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Unit deleted")).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration`);
  await expect(rail(page).getByRole("link", { name: /Screening Unit/u })).toHaveCount(0);
});

test("a malformed unit identifier stays a local not-found inside the workspace", async ({
  page,
}, testInfo) => {
  await login(page, "administration/units/not-a-unit/access", testInfo);

  await expect(
    page.getByText("The requested Administration resource was not found."),
  ).toBeVisible();
  // The application never guesses which resource was meant, and the frame it failed inside stays.
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/units/not-a-unit/access`);
  await expect(page.getByRole("heading", { name: "Administration", level: 1 })).toBeVisible();
});

test("a caller without authority sees the reason rather than a missing control", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, `${unitPath}/access`, testInfo);

  await expect(page.getByLabel("Unit name")).toBeDisabled();
  await expect(
    page.getByText("You must be a member of this unit or its organisation.").first(),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Unit members" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Delete unit" })).toBeDisabled();
  await expect(page.getByText("You must be the unit owner to delete this unit.")).toBeVisible();
});
