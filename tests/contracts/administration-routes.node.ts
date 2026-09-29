import { expect, test } from "@playwright/test";

import {
  administrationLinks,
  parseAdministrationRoute,
  subscriptionEntryDestination,
  subscriptionSectionHref,
  subscriptionSections,
  unitSectionHref,
  unitSections,
} from "../../src/administration/routes";

const organisationId = "org-00000000-0000-4000-8000-000000000001";
const unitId = "unit-00000000-0000-4000-8000-000000000002";
const productId = "product-00000000-0000-4000-8000-000000000003";
const otherUnitId = "unit-00000000-0000-4000-8000-000000000004";

test.describe("Administration route contract", () => {
  const canonicalHrefs = [
    ["/administration", () => administrationLinks.overview()],
    ["/administration/charges", () => administrationLinks.organisationCharges()],
    ["/administration/usage", () => administrationLinks.organisationUsage()],
    [`/administration/units/${unitId}/access`, () => administrationLinks.unitAccess(unitId)],
    [
      `/administration/units/${unitId}/subscriptions`,
      () => administrationLinks.unitSubscriptions(unitId),
    ],
    [`/administration/units/${unitId}/charges`, () => administrationLinks.unitCharges(unitId)],
    [`/administration/units/${unitId}/usage`, () => administrationLinks.unitUsage(unitId)],
    [
      `/administration/units/${unitId}/subscriptions/${productId}`,
      () => administrationLinks.subscription(unitId, productId),
    ],
    [
      `/administration/units/${unitId}/subscriptions/${productId}/charges`,
      () => administrationLinks.subscriptionCharges(unitId, productId),
    ],
    [
      `/administration/subscriptions/${productId}`,
      () => administrationLinks.subscriptionEntry(productId),
    ],
  ] as const;

  for (const [href, buildHref] of canonicalHrefs) {
    test(`round trips ${href}`, () => {
      expect(buildHref()).toBe(href);
      expect(parseAdministrationRoute(href)).toMatchObject({
        kind: "valid",
        canonicalHref: href,
        needsReplace: false,
      });
    });

    test(`removes unrecognised query state from ${href}`, () => {
      expect(parseAdministrationRoute(`${href}?project=secret&tab=old`)).toMatchObject({
        kind: "valid",
        canonicalHref: href,
        needsReplace: true,
      });
    });
  }

  test("the family entry is the organisation overview itself", () => {
    expect(parseAdministrationRoute("/administration")).toEqual({
      kind: "valid",
      route: { kind: "overview" },
      canonicalHref: "/administration",
      needsReplace: false,
    });
  });

  test("a bare unit URL replace-canonicalises to its Access section", () => {
    expect(parseAdministrationRoute(`/administration/units/${unitId}`)).toEqual({
      kind: "valid",
      route: { kind: "unit-access", unitId },
      canonicalHref: `/administration/units/${unitId}/access`,
      needsReplace: true,
    });
  });

  test("a subscription detail URL is already canonical and never replaces", () => {
    const href = `/administration/units/${unitId}/subscriptions/${productId}`;

    expect(parseAdministrationRoute(href)).toEqual({
      kind: "valid",
      route: { kind: "subscription", productId, unitId },
      canonicalHref: href,
      needsReplace: false,
    });
  });

  test("the convenience entry renders nothing and resolves to the canonical address", () => {
    const href = `/administration/subscriptions/${productId}`;

    expect(parseAdministrationRoute(href)).toEqual({
      kind: "valid",
      route: { kind: "subscription-entry", productId },
      canonicalHref: href,
      needsReplace: false,
    });
    expect(subscriptionEntryDestination(unitId, productId)).toBe(
      administrationLinks.subscription(unitId, productId),
    );
    // The unit it resolves to is the product's own, so two units never share a destination.
    expect(subscriptionEntryDestination(otherUnitId, productId)).toBe(
      `/administration/units/${otherUnitId}/subscriptions/${productId}`,
    );
  });

  test("the overview owns search and nothing else", () => {
    const href = administrationLinks.overview({ search: "screening" });

    expect(href).toBe("/administration?search=screening");
    expect(parseAdministrationRoute(href)).toEqual({
      kind: "valid",
      route: { kind: "overview", search: "screening" },
      canonicalHref: href,
      needsReplace: false,
    });
    expect(parseAdministrationRoute("/administration?search=screening&billing-cycle=-2")).toEqual({
      kind: "valid",
      route: { kind: "overview", search: "screening" },
      canonicalHref: href,
      needsReplace: true,
    });
  });

  test("an emptied search is the absent value rather than a narrowing", () => {
    expect(administrationLinks.overview({ search: "" })).toBe("/administration");
    expect(parseAdministrationRoute("/administration?search=")).toEqual({
      kind: "valid",
      route: { kind: "overview" },
      canonicalHref: "/administration",
      needsReplace: true,
    });
  });

  const chargeRoutes = [
    [
      "organisation",
      (billingCycle: number) => administrationLinks.organisationCharges({ billingCycle }),
      "/administration/charges",
    ],
    [
      "unit",
      (billingCycle: number) => administrationLinks.unitCharges(unitId, { billingCycle }),
      `/administration/units/${unitId}/charges`,
    ],
    [
      "subscription",
      (billingCycle: number) =>
        administrationLinks.subscriptionCharges(unitId, productId, { billingCycle }),
      `/administration/units/${unitId}/subscriptions/${productId}/charges`,
    ],
  ] as const;

  for (const [name, buildHref, pathname] of chargeRoutes) {
    test(`the ${name} ledger owns billing-cycle`, () => {
      expect(buildHref(-3)).toBe(`${pathname}?billing-cycle=-3`);
      expect(parseAdministrationRoute(`${pathname}?billing-cycle=-3`)).toMatchObject({
        kind: "valid",
        route: { state: { billingCycle: -3 } },
        canonicalHref: `${pathname}?billing-cycle=-3`,
        needsReplace: false,
      });
    });

    test(`the ${name} ledger defaults a malformed billing cycle to the current one`, () => {
      expect(parseAdministrationRoute(`${pathname}?billing-cycle=-24`)).toMatchObject({
        kind: "valid",
        route: { state: { billingCycle: 0 } },
        canonicalHref: pathname,
        needsReplace: true,
      });
      expect(buildHref(0)).toBe(pathname);
      expect(() => buildHref(1)).toThrow();
    });
  }

  test("no route outside the three ledgers carries a billing cycle", () => {
    for (const href of [
      "/administration/usage",
      `/administration/units/${unitId}/access`,
      `/administration/units/${unitId}/subscriptions`,
      `/administration/units/${unitId}/usage`,
      `/administration/units/${unitId}/subscriptions/${productId}`,
    ]) {
      expect(parseAdministrationRoute(`${href}?billing-cycle=-2`), href).toMatchObject({
        canonicalHref: href,
        needsReplace: true,
      });
    }
  });

  test("a malformed identifier is a local not-found inside the section addressed", () => {
    const localNotFounds = [
      [`/administration/units/not-a-unit`, "unit-access"],
      [`/administration/units/not-a-unit/access`, "unit-access"],
      [`/administration/units/${productId}/access`, "unit-access"],
      [`/administration/units/not-a-unit/charges`, "unit-charges"],
      [`/administration/units/not-a-unit/usage`, "unit-usage"],
      [`/administration/units/not-a-unit/subscriptions`, "unit-subscriptions"],
      [`/administration/units/${unitId}/subscriptions/not-a-product`, "subscription"],
      [`/administration/units/${unitId}/subscriptions/${unitId}`, "subscription"],
      [
        `/administration/units/${unitId}/subscriptions/not-a-product/charges`,
        "subscription-charges",
      ],
      [`/administration/subscriptions/not-a-product`, "subscription-entry"],
      [`/administration/subscriptions/${organisationId}`, "subscription-entry"],
    ] as const;

    for (const [href, section] of localNotFounds) {
      expect(parseAdministrationRoute(href), href).toEqual({
        kind: "not-found",
        parent: { family: "administration", section },
      });
    }
  });

  test("every removed Administration URL is an ordinary not-found", () => {
    for (const href of [
      "/administration/organisation-access",
      `/administration/organisation-access/organisations/${organisationId}`,
      `/administration/organisation-access/units/${unitId}`,
      "/administration/subscriptions",
      "/administration/usage-inventory",
      `/administration/usage-inventory/units/${unitId}`,
      `/administration/charges/organisations/${organisationId}`,
      `/administration/charges/units/${unitId}`,
      `/administration/charges/products/${productId}`,
      `/administration/units/${unitId}/access/extra`,
      `/administration/organisations/${organisationId}`,
    ]) {
      expect(parseAdministrationRoute(href), href).toEqual({ kind: "not-found" });
    }
  });

  test("builders refuse an identity of the wrong shape", () => {
    expect(() => administrationLinks.unitAccess(productId)).toThrow();
    expect(() => administrationLinks.subscription(unitId, organisationId)).toThrow();
    expect(() => administrationLinks.subscription(productId, productId)).toThrow();
    expect(() => administrationLinks.subscriptionEntry(unitId)).toThrow();
  });

  test("the unit strip offers four sections, each addressing its own route", () => {
    expect(unitSections.map(({ label }) => label)).toEqual([
      "Access",
      "Subscriptions",
      "Charges",
      "Usage & Inventory",
    ]);
    for (const { key } of unitSections) {
      const href = unitSectionHref(key, unitId);
      expect(parseAdministrationRoute(href), href).toMatchObject({
        kind: "valid",
        route: { kind: key, unitId },
        needsReplace: false,
      });
    }
  });

  test("the subscription strip offers two sections, each addressing its own route", () => {
    expect(subscriptionSections.map(({ label }) => label)).toEqual(["Subscription", "Charges"]);
    for (const { key } of subscriptionSections) {
      const href = subscriptionSectionHref(key, unitId, productId);
      expect(parseAdministrationRoute(href), href).toMatchObject({
        kind: "valid",
        route: { kind: key, productId, unitId },
        needsReplace: false,
      });
    }
  });
});
