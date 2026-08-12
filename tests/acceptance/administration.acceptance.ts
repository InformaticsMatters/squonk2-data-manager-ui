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
  await expect(page.getByRole("link", { name: "Subscription Project tier" })).toBeVisible();

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

test("Administration remains available without mutation capability", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, "administration", testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/organisation-access`);
  await expect(
    page.getByRole("navigation", { name: "Administration tasks" }).getByRole("link"),
  ).toHaveText(["Organisation & access", "Subscriptions", "Charges", "Usage & inventory"]);
  await expect(
    page.getByRole("link", { name: /Acceptance Organisation Organisation/u }),
  ).toBeVisible();
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

test("organisation resources do not depend on product access", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/product-failure`);
  await login(
    page,
    `administration/organisation-access/organisations/${fixtureIds.organisation}`,
    testInfo,
  );

  await expect(page.getByRole("heading", { name: "Acceptance Organisation" })).toBeVisible();
  await expect(page.getByText(fixtureIds.organisation, { exact: true })).toBeVisible();
});

test("unnamed products retain canonical subscription and charge links", async ({
  page,
}, testInfo) => {
  await login(page, "administration/subscriptions", testInfo);

  await page.getByRole("link", { name: "Subscription Project tier" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/subscriptions/${fixtureIds.product}`,
  );
  await expect(page.getByRole("heading", { name: "Subscription", level: 3 })).toBeVisible();
  await expect(page.getByText(fixtureIds.product, { exact: true })).toBeVisible();

  await page.goto(`${acceptanceUrls.app}administration/charges`);
  await page.getByRole("link", { name: "Subscription Subscription ledger" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/charges/products/${fixtureIds.product}`,
  );
  await expect(page.getByRole("heading", { name: "Subscription", level: 3 })).toBeVisible();
  await expect(page.getByText(fixtureIds.product, { exact: true })).toBeVisible();
});

test("Charges traverses organisation, unit, and product ledgers with ancestry", async ({
  page,
}, testInfo) => {
  await login(page, "administration/charges", testInfo);

  await expect(
    page.getByRole("link", { name: /Acceptance Unit Unit ledger Acceptance Organisation/u }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: /Subscription Subscription ledger Acceptance Organisation \/ Acceptance Unit/u,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Acceptance Organisation Organisation ledger/u }).click();
  await expect(page.getByRole("heading", { name: "Organisation ledger" })).toBeVisible();
  const organisationUnitRow = page.getByRole("row").filter({ hasText: "Acceptance Unit" });
  await expect(organisationUnitRow.getByText("C 5.00", { exact: true })).toBeVisible();
  await expect(organisationUnitRow.getByText("C 2.50", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Total charges: C 7.50" })).toBeVisible();
  await page.getByRole("link", { name: "Acceptance Unit" }).click();
  await expect(page.getByRole("heading", { name: "Unit ledger" })).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Acceptance Organisation", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(`(owner: ${subjectFor(testInfo)})`, { exact: false })).toBeVisible();
  await expect(page.getByText("Processing subtotal: C 2.50")).toBeVisible();
  await expect(page.getByText("Storage subtotal: C 5.00")).toBeVisible();
  await expect(page.getByText("To be paid by the unit owner")).toBeVisible();
  await page.getByRole("link", { name: /Project Subscription/u }).click();
  await expect(page.getByRole("heading", { name: "Product ledger" })).toBeVisible();
  await expect(page.getByText("Acceptance Organisation / Acceptance Unit")).toBeVisible();
  const processingRow = page.getByRole("row").filter({ hasText: "Acceptance Job" });
  await expect(
    processingRow.getByRole("cell", { name: "Data Manager", exact: true }),
  ).toBeVisible();
  await expect(
    processingRow.getByRole("cell", { name: "Acceptance Job", exact: true }),
  ).toBeVisible();
  await expect(
    processingRow.getByRole("cell", { name: "Acceptance Collection", exact: true }),
  ).toBeVisible();
  await expect(
    processingRow.getByRole("cell", { name: subjectFor(testInfo), exact: true }),
  ).toBeVisible();
  await expect(processingRow.getByRole("cell", { name: "Yes", exact: true })).toBeVisible();
  await expect(processingRow.getByRole("cell", { name: "C 2.50", exact: true })).toBeVisible();
  await expect(
    processingRow.getByRole("cell", { name: /\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/u }),
  ).toBeVisible();
  const storageRow = page.getByRole("row").filter({ hasText: "2026-07-31" });
  await expect(storageRow.getByRole("cell", { name: "1 MB", exact: true })).toBeVisible();
  await expect(storageRow.getByRole("cell", { name: "C 5.00", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Total charges: C 7.50" })).toBeVisible();
  await expect(page.getByText("This charge ledger is read-only.")).toBeVisible();
  await expect(page.getByRole("button", { name: /create|edit|delete|manage/u })).toHaveCount(0);
});

// The legacy `/unit/[unitId]/charges` and `/product/[productId]/charges` URLs are the ordinary
// not-found now rather than a redirect into these ledgers, which
// `tests/acceptance/clean-cutover.acceptance.ts` proves alongside every other removed route.

test("billing-cycle history survives refresh, Back, and Forward", async ({ page }, testInfo) => {
  const path = `administration/charges/products/${fixtureIds.product}`;
  await login(page, path, testInfo);
  const billingCycle = page.getByRole("combobox", { name: "Billing cycle" });

  await billingCycle.click();
  await page.getByRole("option", { name: "2 billing cycles ago", exact: true }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}?billing-cycle=-2`);
  await page.reload();
  await expect(billingCycle).toHaveText("2 billing cycles ago");

  await billingCycle.click();
  await page.getByRole("option", { name: "1 billing cycle ago", exact: true }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}?billing-cycle=-1`);
  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}?billing-cycle=-2`);
  await expect(billingCycle).toHaveText("2 billing cycles ago");
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}?billing-cycle=-1`);
  await expect(billingCycle).toHaveText("1 billing cycle ago");
});

test("empty charge ledgers retain their selected resource", async ({ page, request }, testInfo) => {
  await request.put(
    `${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=empty-charges`,
  );
  const path = `administration/charges/units/${fixtureIds.unit}`;
  await login(page, path, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  await expect(
    page.getByText("No product charges were recorded for this billing cycle."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Total charges: C 0.00" })).toBeVisible();
});

test("charge failures retry without losing resource or billing cycle", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/charge-failure?status=503`);
  const path = `administration/charges/units/${fixtureIds.unit}?billing-cycle=-3`;
  await login(page, path, testInfo);

  await expect(
    page.getByText("The Administration service failed to respond. Retry this task."),
  ).toBeVisible();
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/charge-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  await expect(page.getByRole("heading", { name: "Unit ledger" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Billing cycle" })).toHaveText(
    "3 billing cycles ago",
  );
});

test("a caller with no owners at all is told which relationship Subscriptions needs", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=no-access`);
  await login(page, "administration/subscriptions", testInfo);

  await expect(page.getByText(/No subscriptions are available/u)).toBeVisible();
  await expect(page.getByText(/Contact an organisation owner/u)).toBeVisible();
});

test("owners with no subscription stay readable and keep offering one", async ({
  page,
  request,
}, testInfo) => {
  await request.put(
    `${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=empty-products`,
  );
  await login(page, "administration/subscriptions", testInfo);

  await expect(
    page.getByText(
      "No subscriptions are available yet in the organisations and units you can see.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Acceptance Organisation" }),
  ).toBeVisible();
  await expect(page.getByText("This unit holds no subscriptions.")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Create dataset storage subscription" }).first(),
  ).toBeEnabled();
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
  await login(
    page,
    "administration/subscriptions/product-99999999-9999-9999-9999-999999999999",
    testInfo,
  );

  await expect(page.getByRole("navigation", { name: "Administration tasks" })).toBeVisible();
  await expect(
    page.getByText("This Administration resource is no longer available."),
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
  await expect(page.getByRole("link", { name: "Subscription Project tier" })).toBeVisible();
});

test("Subscriptions groups every accessible subscription under the owner that pays for it", async ({
  page,
}, testInfo) => {
  await login(page, "administration/subscriptions", testInfo);

  // Every owner the caller can see is a group, in a stable order, whether or not it holds one.
  await expect(page.getByRole("main").getByRole("heading", { level: 3 })).toHaveText([
    "Acceptance Organisation",
    "Default Organisation",
    "Partner Organisation",
  ]);
  // Units are listed beneath the organisation that contains them, in the same stable order.
  await expect(page.getByRole("main").getByRole("heading", { level: 4 })).toHaveText([
    "Acceptance Unit",
    "Screening Unit",
    subjectFor(testInfo),
  ]);
  // Ancestry is the group a subscription is in, and its technical identity travels with it.
  await expect(
    page.getByRole("link", {
      name: `Dataset Storage Dataset storage ${fixtureIds.storageProduct}`,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: `Unclaimed Project Tier Project tier ${fixtureIds.claimableProduct}`,
    }),
  ).toBeVisible();
  // An organisation whose units the caller cannot see is still readable as itself.
  await expect(page.getByText("No units of this organisation are visible to you.")).toBeVisible();

  await page.getByRole("link", { name: "Subscription Project tier" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/subscriptions/${fixtureIds.product}`,
  );
  // User-facing content says Subscriptions; the technical detail keeps the Product ID and type.
  await expect(page.getByText("Acceptance Organisation / Acceptance Unit")).toBeVisible();
  await expect(page.getByText("Product ID", { exact: true })).toBeVisible();
  await expect(page.getByText(fixtureIds.product, { exact: true })).toBeVisible();
  await expect(
    page.getByText("Product type: DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION"),
  ).toBeVisible();
  await expect(page.getByText("Tier: Bronze")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View this subscription's charges" }),
  ).toHaveAttribute(
    "href",
    `/data-manager-ui/administration/charges/products/${fixtureIds.product}`,
  );

  // Claim information names the project using the subscription and links the route that owns it.
  await expect(
    page.getByText(`This subscription is claimed by Acceptance Project (${fixtureIds.project}).`),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Manage this project" })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/${fixtureIds.project}/manage`,
  );
  // A claimed subscription cannot be deleted, and says which deletion has to happen first.
  await expect(page.getByRole("button", { name: "Delete subscription" })).toBeDisabled();
  await expect(
    page.getByText("Delete the project using this subscription before deleting the subscription."),
  ).toBeVisible();
  // A project tier takes its allowance from its tier, so only its name is offered.
  await expect(page.getByLabel("Allowance")).toHaveCount(0);
  await expect(
    page.getByText("A project tier subscription takes its allowance and limit from its tier."),
  ).toBeVisible();
});

test("an unclaimed project tier hands off to Project creation and can be deleted", async ({
  page,
}, testInfo) => {
  const path = `administration/subscriptions/${fixtureIds.claimableProduct}`;
  await login(page, path, testInfo);

  await expect(page.getByRole("heading", { name: "Unclaimed Project Tier" })).toBeVisible();
  await expect(page.getByText("Acceptance Organisation / Screening Unit")).toBeVisible();
  await expect(page.getByText("No project is using this subscription yet.")).toBeVisible();
  // The handoff carries the validated product identity to the route that owns project creation.
  await expect(page.getByRole("link", { name: "Create linked project" })).toHaveAttribute(
    "href",
    `/data-manager-ui/projects/new?subscription=${fixtureIds.claimableProduct}`,
  );

  await page.getByRole("button", { name: "Delete subscription" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/subscriptions`);
  await expect(page.getByRole("link", { name: `Unclaimed Project Tier Project tier` })).toHaveCount(
    0,
  );
});

test("a dataset storage subscription is created and adjusted where its unit is", async ({
  page,
}, testInfo) => {
  await login(page, "administration/subscriptions", testInfo);

  await page
    .getByRole("button", { name: "Create dataset storage subscription in Screening Unit" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Create dataset storage subscription in Screening Unit" }),
  ).toBeVisible();
  await page.getByLabel("Subscription name").fill("Screening Storage");
  await page.getByLabel("Allowance").fill("250");
  await page.getByRole("button", { name: "Create", exact: true }).click();

  const created = page.getByRole("link", {
    name: `Screening Storage Dataset storage ${fixtureIds.createdStorageProduct}`,
  });
  await expect(created).toBeVisible();
  await created.click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/subscriptions/${fixtureIds.createdStorageProduct}`,
  );
  await expect(page.getByText("Allowance: 0 of 250 coins used")).toBeVisible();

  await page.getByLabel("Allowance").fill("500");
  await page.getByRole("button", { name: "Adjust subscription" }).click();
  await expect(page.getByText("Allowance: 0 of 500 coins used")).toBeVisible();
  // An allowance can be increased but never reduced, which the form states and refuses itself
  // rather than sending a request whose only possible answer is a rejection.
  await expect(page.getByText("An allowance can be increased but never reduced.")).toBeVisible();
  await expect(page.getByLabel("Allowance")).toHaveAttribute("min", "500");
  await page.getByLabel("Allowance").fill("400");
  await expect(page.getByText("An allowance cannot be reduced")).toBeVisible();
  await expect(page.getByRole("button", { name: "Adjust subscription" })).toBeDisabled();
});

test("a rejected subscription command changes neither the subscription nor the route", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const path = `administration/subscriptions/${fixtureIds.storageProduct}`;
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/subscription-mutation-failure?status=403`,
  );
  await login(page, path, testInfo);

  await page.getByLabel("Subscription name").fill("Rejected Storage");
  await page.getByRole("button", { name: "Adjust subscription" }).click();
  await expect(
    page.getByText(
      `You no longer have permission to adjust subscription ${fixtureIds.storageProduct}. The displayed resource has not changed.`,
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  await expect(page.getByRole("heading", { name: "Dataset Storage" })).toBeVisible();
  // The entered value survives the rejection, so the same change can simply be retried.
  await expect(page.getByLabel("Subscription name")).toHaveValue("Rejected Storage");

  await page.getByRole("button", { name: "Delete subscription" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(
    page.getByText(
      `You no longer have permission to delete subscription ${fixtureIds.storageProduct}. The displayed resource has not changed.`,
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  // The confirmation stays open for a deliberate retry rather than closing on a failure.
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await request.delete(
    `${acceptanceUrls.control}/scenario/${subject}/subscription-mutation-failure`,
  );
  await page.getByRole("button", { name: "Adjust subscription" }).click();
  await expect(page.getByRole("heading", { name: "Rejected Storage" })).toBeVisible();
});

test("a caller who cannot change a subscription is told why, and nothing is hidden", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, `administration/subscriptions/${fixtureIds.storageProduct}`, testInfo);

  await expect(page.getByRole("heading", { name: "Dataset Storage" })).toBeVisible();
  const refusal = "You must be a member of this unit or its organisation to";
  await expect(page.getByRole("button", { name: "Adjust subscription" })).toBeDisabled();
  await expect(page.getByText(`${refusal} adjust this subscription.`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete subscription" })).toBeDisabled();
  await expect(page.getByText(`${refusal} delete this subscription.`)).toBeVisible();

  await page.goto(`${acceptanceUrls.app}administration/subscriptions`);
  await expect(
    page.getByRole("button", { name: "Create dataset storage subscription" }).first(),
  ).toBeDisabled();
  await expect(page.getByText(`${refusal} create a subscription.`).first()).toBeVisible();
});

test("Organisation & access exposes lifecycle resources with generated semantics", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, "administration/organisation-access", testInfo);

  await expect(
    page.getByRole("link", { name: /Default Organisation Default organisation/u }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Acceptance Organisation Organisation/u }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: new RegExp(`${subject} Personal unit Default Organisation`, "u"),
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Acceptance Unit Unit Acceptance Organisation/u }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Create organisation" })).toHaveCount(0);
});

test("units are created from the organisation resource in the address bar", async ({
  page,
}, testInfo) => {
  await login(
    page,
    `administration/organisation-access/organisations/${fixtureIds.organisation}`,
    testInfo,
  );

  await page.getByRole("button", { name: "Create unit" }).click();
  await page.getByLabel("Unit name").fill("Acceptance Unit");
  await expect(page.getByText("The name is already used for a unit")).toBeVisible();
  await page.getByLabel("Unit name").fill("Formulation Unit");
  await page.getByRole("button", { name: "Create", exact: true }).click();

  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/organisation-access/units/${fixtureIds.createdUnit}`,
  );
  await expect(page.getByRole("heading", { name: "Formulation Unit" })).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Acceptance Organisation", { exact: true }),
  ).toBeVisible();
});

test("renaming a unit targets the URL resource and survives refresh", async ({
  page,
}, testInfo) => {
  const path = `administration/organisation-access/units/${fixtureIds.unit}`;
  await login(page, path, testInfo);

  await page.getByLabel("Unit name").fill("Renamed Unit");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.getByRole("heading", { name: "Renamed Unit" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Renamed Unit" })).toBeVisible();
  await page.goto(`${acceptanceUrls.app}administration/organisation-access`);
  await expect(page.getByRole("link", { name: /Renamed Unit Unit/u })).toBeVisible();
});

test("unit members and privacy are managed on the unit resource", async ({ page }, testInfo) => {
  const subject = subjectFor(testInfo);
  const path = `administration/organisation-access/units/${fixtureIds.unit}`;
  await login(page, path, testInfo);

  const colleague = `${subject}-observer`;
  await expect(page.getByLabel(`Remove ${subject}`, { exact: true })).toHaveCount(0);
  await page.getByLabel(`Remove ${colleague}`).click();
  await expect(page.getByText(`Member ${colleague} removed`)).toBeVisible();
  await expect(page.getByRole("button", { name: colleague, exact: true })).toHaveCount(0);

  await page.getByRole("combobox", { name: "Unit members" }).click();
  await page.getByRole("option", { name: colleague, exact: true }).click();
  await expect(page.getByText(`Member ${colleague} added`)).toBeVisible();
  await expect(page.getByRole("button", { name: colleague, exact: true })).toBeVisible();

  // The unit's own default, what it inherits, and what new projects actually take are all stated.
  await expect(
    page.getByText(
      "The organisation's declared default is Default Private. It starts off new units; this unit's own default governs its projects.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "New projects in this unit start private, and their creator may choose otherwise.",
      { exact: true },
    ),
  ).toBeVisible();

  await page.getByRole("combobox", { name: "Default project privacy" }).click();
  await page.getByRole("option", { name: "Always private" }).click();
  await expect(page.getByText("Unit default privacy updated")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Default project privacy" })).toHaveText(
    "Always Private",
  );
  await expect(
    page.getByText(
      "New projects in this unit are always private, because this unit's default is Always Private.",
      { exact: true },
    ),
  ).toBeVisible();
});

test("organisation members and default privacy are managed on the organisation resource", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const path = `administration/organisation-access/organisations/${fixtureIds.organisation}`;
  await login(page, path, testInfo);

  const colleague = `${subject}-observer`;
  // The list states the organisation's real membership, the caller included, and the owner it
  // cannot give up: the generated resource keeps its owner, so that member is displayed without any
  // control that offers to remove it.
  await expect(page.getByRole("main").getByText(subject, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: subject, exact: true })).toHaveCount(0);
  await expect(page.getByLabel(`Remove ${subject}`, { exact: true })).toHaveCount(0);
  await page.getByLabel(`Remove ${colleague}`).click();
  await expect(page.getByText(`Member ${colleague} removed`)).toBeVisible();
  await expect(page.getByRole("button", { name: colleague, exact: true })).toHaveCount(0);

  await page.getByRole("combobox", { name: "Organisation members" }).click();
  await page.getByRole("option", { name: colleague, exact: true }).click();
  await expect(page.getByText(`Member ${colleague} added`)).toBeVisible();
  await expect(page.getByRole("button", { name: colleague, exact: true })).toBeVisible();

  await expect(
    page.getByText(
      "Units created from now on start from Default Private. Existing units keep the default they already declare.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "Default project privacy" }).click();
  await page.getByRole("option", { name: "Always private" }).click();
  await expect(page.getByText("Organisation default privacy updated")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Default project privacy" })).toHaveText(
    "Always Private",
  );
  await expect(
    page.getByText(
      "Units created from now on start from Always Private, which this organisation requires. Existing units keep the default they already declare.",
      { exact: true },
    ),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole("combobox", { name: "Default project privacy" })).toHaveText(
    "Always Private",
  );
});

/**
 * The generated organisation patch says an existing unit keeps the default it already declares, so
 * an organisation requirement constrains what that unit may be changed to and nothing else. The
 * server decides which values conflict; the unit's own default is what its projects take.
 */
test("an organisation requirement constrains its units without restating what they take", async ({
  page,
}, testInfo) => {
  await login(
    page,
    `administration/organisation-access/organisations/${fixtureIds.organisation}`,
    testInfo,
  );

  await page.getByRole("combobox", { name: "Default project privacy" }).click();
  await page.getByRole("option", { name: "Always private" }).click();
  await expect(page.getByText("Organisation default privacy updated")).toBeVisible();

  await page.goto(
    `${acceptanceUrls.app}administration/organisation-access/units/${fixtureIds.unit}`,
  );
  await expect(
    page.getByText(
      "The organisation requires Always Private. This unit's own default governs its projects, and a change that conflicts with the organisation is rejected.",
      { exact: true },
    ),
  ).toBeVisible();
  // The unit kept the default it already declared, and that is still what its projects take.
  const privacy = page.getByRole("combobox", { name: "Default project privacy" });
  await expect(privacy).toHaveText("Default Private");
  await expect(
    page.getByText(
      "New projects in this unit start private, and their creator may choose otherwise.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "The organisation requires Always Private, so a value that conflicts with it is rejected.",
      { exact: true },
    ),
  ).toBeVisible();

  // The action stays available because only the server decides a conflict, and it explains itself.
  await privacy.click();
  await page.getByRole("option", { name: "Always public" }).click();
  await expect(
    page.getByText("The unit privacy conflicts with its organisation's value"),
  ).toBeVisible();
  await expect(privacy).toHaveText("Default Private");
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/organisation-access/units/${fixtureIds.unit}`,
  );
});

test("deleting a unit returns to the Organisation & access index", async ({ page }, testInfo) => {
  await login(page, `administration/organisation-access/units/${fixtureIds.unit}`, testInfo);

  await page.getByRole("button", { name: "Delete unit" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/organisation-access`);
  await expect(page.getByRole("link", { name: /Acceptance Unit Unit/u })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Screening Unit Unit Acceptance Organisation/u }),
  ).toBeVisible();
});

test("personal units explain what cannot be changed", async ({ page }, testInfo) => {
  await login(
    page,
    `administration/organisation-access/units/${fixtureIds.personalUnit}`,
    testInfo,
  );

  await expect(page.getByText("Personal unit", { exact: true })).toBeVisible();
  await expect(page.getByText("Personal units cannot be renamed or reconfigured.")).toHaveCount(2);
  await expect(page.getByText("Members of a personal unit cannot be changed.")).toBeVisible();
  await expect(page.getByLabel("Unit name")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Delete unit" })).toBeEnabled();
  // The default organisation requires its privacy, and the personal unit declares the same.
  await expect(
    page.getByText(
      "The organisation requires Always Private. This unit's own default governs its projects, and a change that conflicts with the organisation is rejected.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "New projects in this unit are always private, because this unit's default is Always Private.",
      { exact: true },
    ),
  ).toBeVisible();

  await page.goto(
    `${acceptanceUrls.app}administration/organisation-access/organisations/${fixtureIds.defaultOrganisation}`,
  );
  await expect(page.getByRole("button", { name: "Create unit" })).toBeDisabled();
  await expect(
    page.getByText("The default organisation only contains personal units."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Create personal unit" })).toBeDisabled();
  await expect(page.getByText("You already have a personal unit.")).toBeVisible();
});

test("a missing personal unit can be created from the default organisation", async ({
  page,
  request,
}, testInfo) => {
  await request.put(
    `${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=no-personal-unit`,
  );
  await login(
    page,
    `administration/organisation-access/organisations/${fixtureIds.defaultOrganisation}`,
    testInfo,
  );

  await expect(page.getByText("This organisation has no units you can see.")).toBeVisible();
  await page.getByRole("button", { name: "Create personal unit" }).click();

  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/organisation-access/units/${fixtureIds.personalUnit}`,
  );
  await expect(page.getByText("Personal unit", { exact: true })).toBeVisible();
});

test("organisation creation is a hidden platform-administrator action", async ({
  page,
  request,
}, testInfo) => {
  await request.put(
    `${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=platform-admin`,
  );
  await login(page, "administration/organisation-access", testInfo);

  await page.getByRole("button", { name: "Create organisation" }).click();
  await page.getByLabel("Organisation name").fill("Discovery Organisation");
  await expect(page.getByLabel("Owner (username)")).toHaveValue(subjectFor(testInfo));
  await page.getByLabel("Owner (username)").fill(`${subjectFor(testInfo)}-observer`);
  await page.getByRole("button", { name: "Create", exact: true }).click();

  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/organisation-access/organisations/${fixtureIds.createdOrganisation}`,
  );
  await expect(page.getByRole("heading", { name: "Discovery Organisation" })).toBeVisible();
  await expect(page.getByText(`Owner: ${subjectFor(testInfo)}-observer`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Create unit" })).toBeEnabled();
});

/**
 * The generated endpoint would accept a caller removing itself from an organisation it belongs to.
 * Organisation & access does not offer it, so a member cannot lose the resource it is standing on
 * by way of a chip. This profile is the one where the caller is a listed member and somebody else
 * owns the organisation, so each protection is visible on its own.
 */
test("a member is never offered the removal that would take its own organisation away", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.put(`${acceptanceUrls.control}/scenario/${subject}?profile=platform-admin`);
  await login(
    page,
    `administration/organisation-access/organisations/${fixtureIds.organisation}`,
    testInfo,
  );

  const colleague = `${subject}-observer`;
  await expect(page.getByRole("combobox", { name: "Organisation members" })).toBeEnabled();
  await expect(page.getByRole("main").getByText(subject, { exact: true })).toBeVisible();
  await expect(page.getByLabel(`Remove ${subject}`, { exact: true })).toHaveCount(0);

  // Everyone else in the list stays removable, so the narrowing costs nothing else.
  await page.getByLabel(`Remove ${colleague}`).click();
  await expect(page.getByText(`Member ${colleague} removed`)).toBeVisible();
  await expect(page.getByRole("button", { name: colleague, exact: true })).toHaveCount(0);
});

test("read-only callers keep every action explained", async ({ page, request }, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, `administration/organisation-access/units/${fixtureIds.unit}`, testInfo);

  await expect(page.getByLabel("Unit name")).toBeDisabled();
  await expect(
    page.getByText("You must be a member of this unit or its organisation.").first(),
  ).toBeVisible();
  await expect(
    page.getByText("You must be a unit or organisation member to change unit members."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete unit" })).toBeDisabled();
  await expect(page.getByText("You must be the unit owner to delete this unit.")).toBeVisible();

  await page.goto(
    `${acceptanceUrls.app}administration/organisation-access/organisations/${fixtureIds.organisation}`,
  );
  await expect(page.getByRole("button", { name: "Create unit" })).toBeDisabled();
  // Unit creation, the organisation's own privacy, and its membership all need the relationship the
  // generated endpoints need, so a readable-only caller is told the same thing about each of them
  // rather than a stricter rule for one.
  await expect(
    page.getByText("You must be a member or the owner of this organisation."),
  ).toHaveCount(3);
  await expect(page.getByRole("combobox", { name: "Default project privacy" })).toBeDisabled();
  await expect(page.getByRole("combobox", { name: "Organisation members" })).toBeDisabled();
});

test("read-only reports link to the resource that owns their mutations", async ({
  page,
}, testInfo) => {
  await login(page, `administration/usage-inventory/units/${fixtureIds.unit}`, testInfo);

  await expect(page.getByText("This report is read-only.")).toBeVisible();
  await page
    .getByRole("link", { name: "Manage members and privacy in Organisation & access" })
    .click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/organisation-access/units/${fixtureIds.unit}`,
  );
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();

  await page.goto(`${acceptanceUrls.app}administration/charges/units/${fixtureIds.unit}`);
  await page
    .getByRole("link", { name: "Manage members and privacy in Organisation & access" })
    .click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/organisation-access/units/${fixtureIds.unit}`,
  );

  await page.goto(`${acceptanceUrls.app}administration/charges/products/${fixtureIds.product}`);
  await page.getByRole("link", { name: "Manage this subscription in Subscriptions" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/subscriptions/${fixtureIds.product}`,
  );
});

test("rejected mutations retain the resource, the route, and entered values", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const path = `administration/organisation-access/units/${fixtureIds.unit}`;
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/access-failure?status=403`);
  await login(page, path, testInfo);

  await page.getByLabel("Unit name").fill("Rejected Unit");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(
    page.getByText(
      `You no longer have permission to rename unit ${fixtureIds.unit}. The displayed resource has not changed.`,
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  await expect(page.getByLabel("Unit name")).toHaveValue("Rejected Unit");
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();

  // A rejected privacy change leaves the unit stating the privacy it still has.
  await page.getByRole("combobox", { name: "Default project privacy" }).click();
  await page.getByRole("option", { name: "Always public" }).click();
  await expect(
    page.getByText(
      `You no longer have permission to update the default project privacy of unit ${fixtureIds.unit}. The displayed resource has not changed.`,
    ),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Default project privacy" })).toHaveText(
    "Default Private",
  );

  // A rejected membership change leaves the name that was typed where it was typed.
  const members = page.getByRole("combobox", { name: "Unit members" });
  await members.click();
  await members.fill("rejected-member");
  await members.press("Enter");
  await expect(
    page.getByText(
      `You no longer have permission to manage members of unit ${fixtureIds.unit}. The displayed resource has not changed.`,
    ),
  ).toBeVisible();
  await expect(members).toHaveValue("rejected-member");

  // The organisation resource answers a rejection the same way, naming itself and changing nothing.
  const organisationPath = `administration/organisation-access/organisations/${fixtureIds.organisation}`;
  await page.goto(`${acceptanceUrls.app}${organisationPath}`);
  await page.getByRole("combobox", { name: "Default project privacy" }).click();
  await page.getByRole("option", { name: "Always public" }).click();
  await expect(
    page.getByText(
      `You no longer have permission to update the default project privacy of organisation ${fixtureIds.organisation}. The displayed resource has not changed.`,
    ),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Default project privacy" })).toHaveText(
    "Default Private",
  );
  const organisationMembers = page.getByRole("combobox", { name: "Organisation members" });
  await organisationMembers.click();
  await organisationMembers.fill("rejected-member");
  await organisationMembers.press("Enter");
  await expect(
    page.getByText(
      `You no longer have permission to manage members of organisation ${fixtureIds.organisation}. The displayed resource has not changed.`,
    ),
  ).toBeVisible();
  await expect(organisationMembers).toHaveValue("rejected-member");
  await expect(page).toHaveURL(`${acceptanceUrls.app}${organisationPath}`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/access-failure`);
  await page.goto(`${acceptanceUrls.app}${path}`);
  await page.getByLabel("Unit name").fill("Rejected Unit");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.getByRole("heading", { name: "Rejected Unit" })).toBeVisible();
});

test("unresolved resource semantics defer every capability to the server", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/semantics-failure`);
  await login(
    page,
    `administration/organisation-access/units/${fixtureIds.personalUnit}`,
    testInfo,
  );

  await expect(
    page.getByText("Your permission will be confirmed when you use this action.").first(),
  ).toBeVisible();
  await expect(page.getByLabel("Unit name")).toBeEnabled();
  await expect(page.getByText("Personal unit", { exact: true })).toHaveCount(0);
});

test("transient Organisation & access reads retry without changing scope", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const path = `administration/organisation-access/units/${fixtureIds.unit}`;
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/units-read-failure`);
  await login(page, path, testInfo);

  await expect(page.getByRole("navigation", { name: "Administration tasks" })).toBeVisible();
  await expect(
    page.getByText("Administration data could not be loaded. Retry this task."),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/units-read-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
});

test("resources readable outside the caller's index open from a direct link", async ({
  page,
}, testInfo) => {
  const path = `administration/organisation-access/units/${fixtureIds.unlistedUnit}`;
  await login(page, path, testInfo);

  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  await expect(page.getByRole("heading", { name: "Unlisted Unit" })).toBeVisible();
  await expect(
    page.getByRole("main").getByText(fixtureIds.unlistedUnit, { exact: true }),
  ).toBeVisible();
  // Without readable ancestry nothing is claimed about inheritance, and the unit still answers for
  // its own projects, because that never depended on its organisation.
  await expect(
    page.getByText(
      "This unit's organisation is not readable, so its declared default is unknown.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "New projects in this unit start private, and their creator may choose otherwise.",
      { exact: true },
    ),
  ).toBeVisible();

  await page.goto(
    `${acceptanceUrls.app}administration/organisation-access/organisations/${fixtureIds.unlistedOrganisation}`,
  );
  await expect(page.getByRole("heading", { name: "Unlisted Organisation" })).toBeVisible();
  await expect(
    page.getByRole("main").getByText(fixtureIds.unlistedOrganisation, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("This organisation has no units you can see.")).toBeVisible();
});

test("access-denied resources explain the denial without leaving the task", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/addressed-read-failure?status=403`,
  );
  const path = `administration/organisation-access/units/${fixtureIds.unit}`;
  await login(page, path, testInfo);

  await expect(page.getByRole("navigation", { name: "Administration tasks" })).toBeVisible();
  await expect(
    page.getByText("You do not have access to this Administration resource."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
});

test("transient addressed resource reads retry without changing scope", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const path = `administration/organisation-access/units/${fixtureIds.unit}`;
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/addressed-read-failure?status=503`,
  );
  await login(page, path, testInfo);

  await expect(page.getByRole("navigation", { name: "Administration tasks" })).toBeVisible();
  await expect(
    page.getByText("Administration data could not be loaded. Retry this task."),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/addressed-read-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
});

test("an empty Organisation & access index explains how to obtain access", async ({
  page,
  request,
}, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=no-access`);
  await login(page, "administration/organisation-access", testInfo);

  await expect(page.getByRole("heading", { name: "Organisation & access", level: 2 })).toHaveCount(
    1,
  );
  await expect(page.getByText(/No organisations or units are available/u)).toBeVisible();
  await expect(page.getByText(/Contact an organisation owner/u)).toBeVisible();
});

test("unknown and wrongly typed Organisation & access resources stay local", async ({
  page,
}, testInfo) => {
  await login(
    page,
    "administration/organisation-access/organisations/org-99999999-9999-4999-8999-999999999999",
    testInfo,
  );

  await expect(
    page.getByRole("heading", { name: "Organisation & access", level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByText("This Administration resource is no longer available."),
  ).toBeVisible();

  await page.goto(
    `${acceptanceUrls.app}administration/organisation-access/organisations/${fixtureIds.unit}`,
  );
  await expect(page.getByRole("navigation", { name: "Administration tasks" })).toBeVisible();
  await expect(
    page.getByText("The requested Administration resource was not found."),
  ).toBeVisible();
});

test("a unit report pivots between its users and its projects", async ({ page }, testInfo) => {
  const subject = subjectFor(testInfo);
  const colleague = `${subject}-observer`;
  const path = `administration/usage-inventory/units/${fixtureIds.unit}`;
  await login(page, path, testInfo);

  // The addressed unit and the organisation holding it are both stated by the report.
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Acceptance Organisation", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByText(fixtureIds.unit, { exact: true })).toBeVisible();
  await expect(page.getByText(`Owner: ${subject}`, { exact: true })).toBeVisible();
  await expect(page.getByText(`Members: ${subject}, ${colleague}`)).toBeVisible();

  // The user pivot accounts for the unit's own members and states each one's usage facts.
  await expect(page.getByRole("cell", { name: subject, exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: colleague, exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "10 days", exact: true }).first()).toBeVisible();
  // A user the inventory named who belongs to neither the unit nor one of its projects is not
  // reported by it.
  await expect(page.getByText(`${subject}-outsider`, { exact: true })).toHaveCount(0);

  // Project roles are reported, never changed: each is a link to the project that owns them.
  await expect(page.getByRole("link", { name: "Acceptance Project" }).first()).toHaveAttribute(
    "href",
    new RegExp(`/projects/${fixtureIds.project}/manage$`, "u"),
  );

  await page.getByRole("button", { name: "By project" }).click();
  await expect(page.getByRole("heading", { name: "Project Members" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Acceptance Project" })).toBeVisible();
  await expect(page.getByRole("cell", { name: subject, exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);

  // Bringing a project into existence belongs to Projects, so the report offers nothing of the kind.
  await expect(page.getByRole("button", { name: /create project/iu })).toHaveCount(0);
  await expect(page.getByLabel("Project name")).toHaveCount(0);

  await page.getByRole("link", { name: "Manage project" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}projects/${fixtureIds.project}/manage`);
});

test("an organisation report accounts for its units across the caller's work", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const colleague = `${subject}-observer`;
  await login(page, "administration/usage-inventory", testInfo);

  await expect(page.getByText("Reports are read-only.", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: /Acceptance Organisation Organisation report/u }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/usage-inventory/organisations/${fixtureIds.organisation}`,
  );
  await expect(page.getByRole("heading", { name: "Acceptance Organisation" })).toBeVisible();
  await expect(page.getByText(`Members: ${subject}, ${colleague}`)).toBeVisible();

  // Each user is accounted for against the units of this organisation, with the projects they may
  // change counted, and a unit they merely belong to counted as none.
  await expect(page.getByRole("link", { name: "Acceptance Unit (1)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Screening Unit (1)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Acceptance Unit (0)" })).toBeVisible();
  await expect(page.getByText(`${subject}-outsider`, { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Acceptance Unit (1)" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/usage-inventory/units/${fixtureIds.unit}`,
  );
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/usage-inventory/organisations/${fixtureIds.organisation}`,
  );
  await expect(page.getByRole("heading", { name: "Acceptance Organisation" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/usage-inventory/units/${fixtureIds.unit}`,
  );
});

test("a report with nothing to account for explains itself", async ({ page }, testInfo) => {
  await login(
    page,
    `administration/usage-inventory/organisations/${fixtureIds.otherOrganisation}`,
    testInfo,
  );

  await expect(page.getByRole("heading", { name: "Partner Organisation" })).toBeVisible();
  await expect(
    page.getByText("No users are accounted for in this organisation's units.", { exact: false }),
  ).toBeVisible();
});

test("a report stays readable without mutation capability", async ({ page, request }, testInfo) => {
  await request.put(`${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=read-only`);
  await login(page, `administration/usage-inventory/units/${fixtureIds.unit}`, testInfo);

  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();
  await expect(page.getByRole("cell", { name: subjectFor(testInfo), exact: true })).toBeVisible();
  // Nothing on a report is a control that changes what it reports, whatever the caller may do.
  await expect(page.getByRole("textbox", { name: "Unit name" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Unit members" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete unit" })).toHaveCount(0);
  // The link to the owning task is still offered, beside what that task would require of them.
  await expect(
    page.getByRole("link", { name: "Manage members and privacy in Organisation & access" }),
  ).toBeVisible();
  await expect(
    page.getByText("You must be a unit or organisation member to change unit members."),
  ).toBeVisible();
});

test("a refused report is told apart from a missing one and from a stale one", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const path = `administration/usage-inventory/units/${fixtureIds.unit}`;
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/inventory-failure?status=403`);
  await login(page, path, testInfo);

  // A refusal is answered where the report is: the addressed unit and the route are unchanged.
  await expect(
    page.getByText("You do not have access to this Administration resource."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);

  await request.post(`${acceptanceUrls.control}/scenario/${subject}/inventory-failure?status=404`);
  await page.reload();
  await expect(
    page.getByText("This Administration resource is no longer available."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acceptance Unit" })).toBeVisible();

  // A report that was read and then could not be refreshed stays readable and says so.
  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/inventory-failure`);
  await page.reload();
  await expect(page.getByRole("cell", { name: subject, exact: true })).toBeVisible();
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/inventory-failure?status=503`);
  await page.getByRole("link", { name: "Charges" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges`);
  await page.goBack();
  await expect(
    page.getByText("This report could not be refreshed and may be out of date.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: subject, exact: true })).toBeVisible();

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/inventory-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(
    page.getByText("This report could not be refreshed and may be out of date.", { exact: false }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
});

test("a rate-limited report retries in place without changing the resource", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  const path = `administration/usage-inventory/organisations/${fixtureIds.organisation}`;
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/inventory-failure?status=429`);
  await login(page, path, testInfo);

  // Rate limiting says so rather than reading as any other failure to load.
  await expect(page.getByRole("navigation", { name: "Administration tasks" })).toBeVisible();
  await expect(
    page.getByText("Administration requests are temporarily rate-limited. Retry this task."),
  ).toBeVisible();

  // A server failure is its own answer, reached from the same report without changing the route.
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/inventory-failure?status=503`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(
    page.getByText("The Administration service failed to respond. Retry this task."),
  ).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/inventory-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}${path}`);
  await expect(page.getByRole("link", { name: "Acceptance Unit (1)" })).toBeVisible();
});
