import { expect, type Page, test, type TestInfo } from "@playwright/test";

import { fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";
import { linkColour } from "./theme";

/**
 * The organisation half of the Administration workspace: the overview the masthead organisation
 * scopes, the rail that lists its units, and the two organisation-level reports beside it.
 *
 * The unit workspace has its own file. One file per family is what grew the previous Administration
 * suite past a thousand lines, and the new information architecture provides the seam.
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

/** Every unit the rail is listing right now, whatever narrowed it. */
const railUnits = (page: Page) => rail(page).getByRole("list", { name: "Units" }).getByRole("link");

const workAs = async (page: Page, organisation: string) => {
  await page.getByRole("button", { name: "Change organisation" }).click();
  await page.getByRole("option", { name: organisation }).click();
  // Changing identity leaves for Home first, which is the existing behaviour for every family.
  await expect(page.getByRole("button", { name: "Change organisation" })).toContainText(
    organisation,
  );
};

test("Administration opens on the organisation in the masthead", async ({ page }, testInfo) => {
  await login(page, "administration", testInfo);

  // The family entry is the organisation's own page; there is no task landing to canonicalise to.
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration`);
  await expect(page.getByRole("heading", { name: "Administration", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Acceptance Organisation" }),
  ).toBeVisible();
  await expect(page.getByText(fixtureIds.organisation).first()).toBeVisible();

  // The organisation's own destinations sit at the top of the rail, in a stable order.
  await expect(
    rail(page).getByRole("link", { name: /^(Overview|Charges|Usage & Inventory)$/u }),
  ).toHaveText(["Overview", "Charges", "Usage & Inventory"]);
  // Its units are in the same rail, chosen the same way.
  await expect(rail(page).getByRole("link", { name: /Acceptance Unit/u })).toBeVisible();
  await expect(rail(page).getByRole("link", { name: /Screening Unit/u })).toBeVisible();
});

test("switching the masthead organisation changes which units Administration lists", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, "administration", testInfo);

  await expect(railUnits(page).filter({ hasText: "Acceptance Unit" })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: "Screening Unit" })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: subject })).toHaveCount(0);

  await workAs(page, "Default Organisation");
  await page.goto("administration");

  // The organisation named in the masthead is the organisation Administration shows, so the units
  // on screen are that organisation's — and only that organisation's.
  await expect(page.getByRole("heading", { level: 2, name: "Default Organisation" })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: subject })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: "Acceptance Unit" })).toHaveCount(0);
  await expect(railUnits(page).filter({ hasText: "Screening Unit" })).toHaveCount(0);

  await workAs(page, "Acceptance Organisation");
  await page.goto("administration");
  await expect(railUnits(page).filter({ hasText: "Acceptance Unit" })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: subject })).toHaveCount(0);
});

test("the unit search narrows the rail and survives a refresh through the URL", async ({
  page,
}, testInfo) => {
  await login(page, "administration", testInfo);

  await rail(page).getByLabel("Search units").fill("Screen");
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration?search=Screen`);
  await expect(railUnits(page).filter({ hasText: "Screening Unit" })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: "Acceptance Unit" })).toHaveCount(0);

  await page.reload();
  await expect(rail(page).getByLabel("Search units")).toHaveValue("Screen");
  await expect(railUnits(page).filter({ hasText: "Acceptance Unit" })).toHaveCount(0);

  await rail(page).getByLabel("Search units").fill("nothing here");
  await expect(rail(page).getByText("No unit matches this search.")).toBeVisible();

  await rail(page).getByLabel("Search units").fill("");
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration`);
  await expect(railUnits(page).filter({ hasText: "Acceptance Unit" })).toBeVisible();
});

test("a unit is created without choosing an organisation", async ({ page }, testInfo) => {
  await login(page, "administration", testInfo);

  // No organisation picker: the organisation is already in effect, which is the whole point.
  await page.getByRole("button", { name: "Create unit" }).click();
  await expect(page.getByRole("dialog").getByLabel(/organisation/iu)).toHaveCount(0);
  await page.getByLabel("Unit name").fill("Acceptance Unit");
  await expect(page.getByText("The name is already used for a unit")).toBeVisible();
  await page.getByLabel("Unit name").fill("Created Unit");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/units/${fixtureIds.createdUnit}/access`,
  );
  await expect(page.getByRole("heading", { level: 2, name: "Created Unit" })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: "Created Unit" })).toBeVisible();
});

test("organisation members and default privacy are managed on the overview", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, "administration", testInfo);

  const colleague = `${subject}-observer`;
  // The owner the resource keeps naming is displayed without a control that offers to remove it,
  // and so is the caller standing on the organisation.
  await expect(page.getByLabel(`Remove ${subject}`, { exact: true })).toHaveCount(0);
  await page.getByLabel(`Remove ${colleague}`).click();
  await expect(page.getByText(`Member ${colleague} removed`)).toBeVisible();

  await page.getByRole("combobox", { name: "Organisation members" }).click();
  await page.getByRole("option", { exact: true, name: colleague }).click();
  await expect(page.getByText(`Member ${colleague} added`)).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: colleague })).toBeVisible();

  // Membership is a flat list: no role is offered, because the resource has no notion of one.
  await expect(page.getByRole("combobox", { name: /role/iu })).toHaveCount(0);

  await page.getByLabel("Default project privacy").click();
  await page.getByRole("option", { exact: true, name: "Default Public" }).click();
  await expect(page.getByText("Organisation default privacy updated")).toBeVisible();
  await expect(
    page.getByText(/Units created from now on start from Default Public/u),
  ).toBeVisible();
});

test("the organisation charge ledger owns its billing cycle in the URL", async ({
  page,
}, testInfo) => {
  await login(page, "administration", testInfo);

  await rail(page).getByRole("link", { name: "Charges", exact: true }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges`);
  await expect(page.getByRole("heading", { level: 2, name: "Charges" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Total charges: C 7.50" })).toBeVisible();

  await page.getByLabel("Billing cycle").click();
  await page.getByRole("option", { exact: true, name: "3 billing cycles ago" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges?billing-cycle=-3`);
  await page.reload();
  await expect(page.getByLabel("Billing cycle")).toHaveText("3 billing cycles ago");

  await page.goBack();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges`);
  await page.goForward();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges?billing-cycle=-3`);

  // A unit row carries the period being compared into that unit's own ledger.
  await page
    .getByRole("row")
    .filter({ hasText: "Acceptance Unit" })
    .getByRole("link", { name: "Acceptance Unit" })
    .click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/units/${fixtureIds.unit}/charges?billing-cycle=-3`,
  );
});

test("the organisation usage report accounts for the units of the organisation in effect", async ({
  page,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, "administration/usage", testInfo);

  await expect(page.getByRole("heading", { level: 2, name: "Usage & Inventory" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: subject }).first();
  await expect(row.getByRole("link", { name: /Acceptance Unit/u }).first()).toBeVisible();
  // A user connected to no unit of this organisation is not part of its report.
  await expect(page.getByRole("row").filter({ hasText: `${subject}-outsider` })).toHaveCount(0);

  // The report states no read-only copy of what a unit's own Access section owns.
  await expect(page.getByText("This report is read-only")).toHaveCount(0);
  await expect(page.getByText(/^Members:/u)).toHaveCount(0);
});

test("the default organisation loads without the reads it refuses", async ({ page }, testInfo) => {
  const subject = subjectFor(testInfo);
  await login(page, "administration", testInfo);
  await workAs(page, "Default Organisation");
  await page.goto("administration");

  // The organisation resource itself is refused to an ordinary caller, and the page survives it.
  await expect(page.getByRole("heading", { level: 2, name: "Default Organisation" })).toBeVisible();
  await expect(
    page.getByText(
      /not a member of this organisation, so its members and default project privacy/u,
    ),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Organisation members" })).toHaveCount(0);
  await expect(page.getByLabel("Default project privacy")).toHaveCount(0);

  // No Charges entry is offered, because the Account Server refuses that report for this
  // organisation outright.
  await expect(rail(page).getByRole("link", { name: "Charges", exact: true })).toHaveCount(0);
  await expect(rail(page).getByRole("link", { name: "Usage & Inventory" })).toBeVisible();

  // The personal unit that lives here is listed, and the action that creates one says why not.
  await expect(railUnits(page).filter({ hasText: subject })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create unit" })).toBeDisabled();
  await expect(
    page.getByText("The default organisation only contains personal units."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Create personal unit" })).toBeDisabled();
  await expect(page.getByText("You already have a personal unit.")).toBeVisible();
});

test("a caller with no personal unit creates one where they actually land", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.put(`${acceptanceUrls.control}/scenario/${subject}?profile=no-personal-unit`);
  await login(page, "administration", testInfo);
  await workAs(page, "Default Organisation");
  await page.goto("administration");

  await expect(rail(page).getByText("This organisation has no units yet.")).toBeVisible();
  await page.getByRole("button", { name: "Create personal unit" }).click();

  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/units/${fixtureIds.personalUnit}/access`,
  );
  await expect(page.getByRole("heading", { level: 2, name: subject })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: subject })).toBeVisible();
});

test("organisation charges under the default organisation explain themselves", async ({
  page,
}, testInfo) => {
  await login(page, "administration", testInfo);
  await workAs(page, "Default Organisation");
  await page.goto("administration/charges");

  // A bookmark or a typed URL is answered rather than left to dead-end.
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges`);
  await expect(
    page.getByText(/default organisation has no charge ledger of its own/u),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to the organisation overview" }).click();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration`);
});

test("creating an organisation switches the masthead to it", async ({
  page,
  request,
}, testInfo) => {
  await request.put(
    `${acceptanceUrls.control}/scenario/${subjectFor(testInfo)}?profile=platform-admin`,
  );
  await login(page, "administration", testInfo);

  await page.getByRole("button", { name: "Create organisation" }).click();
  await page.getByLabel("Organisation name").fill("Created Organisation");
  await page.getByRole("button", { name: "Create" }).click();

  // The caller stays on the overview, which is now the overview of what they just made.
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration`);
  await expect(page.getByRole("heading", { level: 2, name: "Created Organisation" })).toBeVisible();
  await expect(page.getByText(fixtureIds.createdOrganisation).first()).toBeVisible();
});

test("organisation creation is hidden from a caller without platform privilege", async ({
  page,
}, testInfo) => {
  await login(page, "administration", testInfo);

  await expect(page.getByRole("button", { name: "Create unit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create organisation" })).toHaveCount(0);
});

test("a recoverable failure keeps the workspace and recovers in place", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/charge-failure?status=503`);
  await login(page, "administration/charges?billing-cycle=-2", testInfo);

  // The frame, the rail and the scope survive; only the section's content is replaced.
  await expect(page.getByText("The Administration service failed to respond.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Administration", level: 1 })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: "Acceptance Unit" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges?billing-cycle=-2`);

  await request.delete(`${acceptanceUrls.control}/scenario/${subject}/charge-failure`);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: /Total charges/u })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges?billing-cycle=-2`);
});

test("a refused report is presented where the report is", async ({ page, request }, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(`${acceptanceUrls.control}/scenario/${subject}/charge-failure?status=403`);
  await login(page, "administration/charges", testInfo);

  // An authoritative refusal is the ledger's own answer, so it is stated in place and offers no
  // retry — while the workspace around it, and the scope in the URL, are untouched.
  await expect(
    page.getByText("You do not have access to this Administration resource."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
  await expect(railUnits(page).filter({ hasText: "Acceptance Unit" })).toBeVisible();
  await expect(page).toHaveURL(`${acceptanceUrls.app}administration/charges`);
});

test("every Administration link is drawn in the theme's link colour", async ({
  page,
}, testInfo) => {
  await login(page, "administration/usage", testInfo);

  // A bare anchor renders as the browser's default blue and `color: inherit` renders as body text;
  // both make clickable text invisible until it is hovered. Related: #1969.
  const colour = await linkColour(page);
  await expect(page.getByRole("link", { name: /Acceptance Unit/u }).nth(1)).toHaveCSS(
    "color",
    colour,
  );
});

test("a refused organisation read removes sections rather than the page", async ({
  page,
  request,
}, testInfo) => {
  const subject = subjectFor(testInfo);
  await request.post(
    `${acceptanceUrls.control}/scenario/${subject}/addressed-read-failure?status=403`,
  );
  await login(page, "administration", testInfo);

  await expect(page.getByRole("button", { name: "Create unit" })).toBeVisible();
  await expect(railUnits(page).filter({ hasText: "Acceptance Unit" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Organisation members" })).toHaveCount(0);
  await expect(
    page.getByText(
      /not a member of this organisation, so its members and default project privacy/u,
    ),
  ).toBeVisible();
});

test("the rail stays pinned while a long report scrolls", async ({ page }, testInfo) => {
  await page.setViewportSize({ height: 500, width: 1280 });
  await login(page, "administration/usage", testInfo);
  await expect(rail(page)).toBeVisible();

  const before = await rail(page).boundingBox();
  // The rail starts below the masthead and the workspace title, so it has somewhere to travel to.
  expect(before?.y ?? 0).toBeGreaterThan(64);

  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(64);
  const after = await rail(page).boundingBox();

  // Sticky travel is the height of the row holding the rail minus the rail's own, so a rail capped
  // below the viewport pins near the top and stays there instead of scrolling away after a few
  // pixels — which is what "not sticky at all" looked like.
  expect(after?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect(after?.y ?? Infinity).toBeLessThanOrEqual(24);

  // And it is still the selector: a unit is one click away without returning to any index.
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.mouse.wheel(0, -600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await railUnits(page).filter({ hasText: "Screening Unit" }).click();
  await expect(page).toHaveURL(
    `${acceptanceUrls.app}administration/units/${fixtureIds.otherUnit}/access`,
  );
});

test("removed Administration URLs are ordinary not-found", async ({ page }, testInfo) => {
  await login(page, "administration", testInfo);

  for (const removed of [
    "administration/organisation-access",
    "administration/subscriptions",
    "administration/usage-inventory",
    `administration/charges/units/${fixtureIds.unit}`,
  ]) {
    await page.goto(removed);
    await expect(page.getByText(/404|not be found/u).first()).toBeVisible();
  }
});
