import { expect, test } from "@playwright/test";

import { administrationLinks, parseAdministrationRoute } from "../../src/administration/routes";
import { isOrganisationId, isProductId, isUnitId } from "../../src/routing/identifiers";
import { assertRouteValue } from "../../src/routing/routeContract";

const organisationId = assertRouteValue(
  "org-00000000-0000-4000-8000-000000000001",
  isOrganisationId,
  "organisation ID fixture",
);
const unitId = assertRouteValue(
  "unit-00000000-0000-4000-8000-000000000002",
  isUnitId,
  "unit ID fixture",
);
const productId = assertRouteValue(
  "product-00000000-0000-4000-8000-000000000003",
  isProductId,
  "product ID fixture",
);

test.describe("Administration route contract", () => {
  const canonicalHrefs = [
    ["/administration/organisation-access", () => administrationLinks.organisationAccess()],
    [
      `/administration/organisation-access/organisations/${organisationId}`,
      () => administrationLinks.organisationAccessResource("organisations", organisationId),
    ],
    [
      `/administration/organisation-access/units/${unitId}`,
      () => administrationLinks.organisationAccessResource("units", unitId),
    ],
    ["/administration/subscriptions", () => administrationLinks.subscriptions()],
    [
      `/administration/subscriptions/${productId}`,
      () => administrationLinks.subscription(productId),
    ],
    ["/administration/charges", () => administrationLinks.charges()],
    [
      `/administration/charges/organisations/${organisationId}`,
      () => administrationLinks.chargeResource("organisations", organisationId),
    ],
    [
      `/administration/charges/units/${unitId}`,
      () => administrationLinks.chargeResource("units", unitId),
    ],
    [
      `/administration/charges/products/${productId}`,
      () => administrationLinks.chargeResource("products", productId),
    ],
    ["/administration/usage-inventory", () => administrationLinks.usageInventory()],
    [
      `/administration/usage-inventory/organisations/${organisationId}`,
      () => administrationLinks.usageInventoryResource("organisations", organisationId),
    ],
    [
      `/administration/usage-inventory/units/${unitId}`,
      () => administrationLinks.usageInventoryResource("units", unitId),
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
    expect(() => {
      // @ts-expect-error Unit IDs cannot identify an organisation resource.
      administrationLinks.organisationAccessResource("organisations", unitId);
    }).toThrow();
    expect(() => {
      // @ts-expect-error Organisation IDs cannot identify a product resource.
      administrationLinks.chargeResource("products", organisationId);
    }).toThrow();
  });
});
