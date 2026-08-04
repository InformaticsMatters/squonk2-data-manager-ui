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
  await expect(page.getByRole("link", { name: "Subscription Subscription" })).toBeVisible();

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

  await page.getByRole("link", { name: "Subscription Subscription" }).click();
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

test("legacy charge URLs redirect to canonical Administration ledgers", async ({
  page,
}, testInfo) => {
  await login(page, `unit/${fixtureIds.unit}/charges`, testInfo);
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/charges/units/${fixtureIds.unit}`,
  );
  await expect(page.getByRole("heading", { name: "Unit ledger" })).toBeVisible();

  await page.goto(`${acceptanceUrls.app}product/${fixtureIds.product}/charges`);
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/charges/products/${fixtureIds.product}`,
  );
  await expect(page.getByRole("heading", { name: "Product ledger" })).toBeVisible();
});

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

test("empty subscriptions explain how to obtain access", async ({ page, request }, testInfo) => {
  await request.put(
    `${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=empty-products`,
  );
  await login(page, "administration/subscriptions", testInfo);

  await expect(page.getByText(/No subscriptions are available/u)).toBeVisible();
  await expect(page.getByText(/Contact an organisation owner/u)).toBeVisible();
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
  await expect(page.getByRole("link", { name: "Subscription Subscription" })).toBeVisible();
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
  await page.getByLabel(`Remove ${colleague}`).click();
  await expect(page.getByText(`Member ${colleague} removed`)).toBeVisible();
  await expect(page.getByRole("button", { name: colleague, exact: true })).toHaveCount(0);

  await page.getByRole("combobox", { name: "Unit members" }).click();
  await page.getByRole("option", { name: colleague, exact: true }).click();
  await expect(page.getByText(`Member ${colleague} added`)).toBeVisible();
  await expect(page.getByRole("button", { name: colleague, exact: true })).toBeVisible();

  await page.getByRole("combobox", { name: "Default project privacy" }).click();
  await page.getByRole("option", { name: "Always public" }).click();
  await expect(page.getByText("Unit default privacy updated")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Default project privacy" })).toHaveText(
    "Always Public",
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
  await expect(
    page.getByText("You must be a member or the owner of this organisation."),
  ).toBeVisible();
  await expect(page.getByText("You must be the owner of this organisation.")).toBeVisible();
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

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/access-failure`);
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
