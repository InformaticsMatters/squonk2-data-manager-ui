import { expect, test } from "@playwright/test";

import { administrationLinks, parseAdministrationRoute } from "../../src/administration/routes";

const organisationId = "org-00000000-0000-4000-8000-000000000001";
const unitId = "unit-00000000-0000-4000-8000-000000000002";
const productId = "product-00000000-0000-4000-8000-000000000003";

test.describe("Administration route contract", () => {
  const canonicalHrefs = [
    administrationLinks.organisationAccess(),
    administrationLinks.organisationAccessResource("organisations", organisationId),
    administrationLinks.organisationAccessResource("units", unitId),
    administrationLinks.subscriptions(),
    administrationLinks.subscription(productId),
    administrationLinks.charges(),
    administrationLinks.chargeResource("organisations", organisationId),
    administrationLinks.chargeResource("units", unitId),
    administrationLinks.chargeResource("products", productId),
    administrationLinks.usageInventory(),
    administrationLinks.usageInventoryResource("organisations", organisationId),
    administrationLinks.usageInventoryResource("units", unitId),
  ];

  for (const href of canonicalHrefs) {
    test(`round trips ${href}`, () => {
      expect(parseAdministrationRoute(href)).toMatchObject({
        kind: "valid",
        canonicalHref: href,
        needsReplace: false,
      });
    });

    test(`removes query state from ${href}`, () => {
      expect(parseAdministrationRoute(`${href}?project=secret`)).toMatchObject({
        kind: "valid",
        canonicalHref: href,
        needsReplace: true,
      });
    });
  }

  test("canonicalises family entry to Organisation & access", () => {
    expect(parseAdministrationRoute("/administration")).toEqual({
      kind: "valid",
      route: { kind: "organisation-access" },
      canonicalHref: administrationLinks.organisationAccess(),
      needsReplace: true,
    });
  });

  test("removes all query state", () => {
    expect(parseAdministrationRoute("/administration/charges?project=secret&tab=old")).toEqual({
      kind: "valid",
      route: { kind: "charges" },
      canonicalHref: administrationLinks.charges(),
      needsReplace: true,
    });
  });

  test("validates identity against its typed collection", () => {
    for (const href of [
      `/administration/organisation-access/organisations/${unitId}`,
      `/administration/subscriptions/${organisationId}`,
      `/administration/charges/products/${unitId}`,
      `/administration/usage-inventory/units/${productId}`,
    ]) {
      expect(parseAdministrationRoute(href), href).toMatchObject({
        kind: "not-found",
        parent: { family: "administration" },
      });
    }
  });

  test("builders reject collection and identity mismatches", () => {
    expect(() => administrationLinks.organisationAccessResource("organisations", unitId)).toThrow();
    expect(() => administrationLinks.chargeResource("products", organisationId)).toThrow();
  });
});
