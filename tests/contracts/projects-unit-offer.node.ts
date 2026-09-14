import { type UnitsGetResponse } from "@/api/account-server";

import { expect, test } from "@playwright/test";

import {
  resolveOrganisationAuthorityFacts,
  type UnitCreationFacts,
  type UnitCreationFreshness,
} from "../../src/application/organisationUnits";
import { decideIndexUnitOffer, unitNamesInOrganisation } from "../../src/projects/projectIndex";

/**
 * What the projects index offers beside **Create project**, proved without a browser.
 *
 * Every case here is one a caller can be in: which organisation they are working as, what that
 * organisation says about them, and whether the unit it holds for them already exists. Nothing
 * reaches for a component, a hook, or the shape of a read.
 */

const organisationId = "org-00000000-0000-4000-8000-000000000001";
const defaultOrganisationId = "org-00000000-0000-4000-8000-0000000000de";
const personalUnitId = "unit-00000000-0000-4000-8000-0000000000de";

const owner = "owner@example.org";
const member = "member@example.org";
const stranger = "stranger@example.org";

const organisation = (overrides: { caller_is_member?: boolean; owner_id?: string } = {}) => ({
  caller_is_member: true,
  id: organisationId,
  owner_id: owner,
  ...overrides,
});

/** A member of a named organisation, working as it, with no personal unit. Every case varies this. */
const facts = (overrides: Partial<UnitCreationFacts> = {}): UnitCreationFacts => ({
  caller: { isPlatformAdministrator: false, username: owner },
  defaultOrganisationId,
  freshness: "current" satisfies UnitCreationFreshness,
  organisation: organisation(),
  organisationId,
  ...overrides,
});

const workingAsDefaultOrganisation = {
  organisation: undefined,
  organisationId: defaultOrganisationId,
};

const unconfirmed = {
  reason: "Your permission will be confirmed when you use this action.",
  status: "enabled",
};

test.describe("The unit offer the projects index makes", () => {
  test("the default organisation offers the caller the personal unit it holds for them", () => {
    expect(decideIndexUnitOffer(facts(workingAsDefaultOrganisation))).toEqual({
      capability: { status: "enabled" },
      kind: "personal",
    });
  });

  test("a caller who already has a personal unit is told so rather than shown nothing", () => {
    expect(
      decideIndexUnitOffer(facts({ ...workingAsDefaultOrganisation, personalUnitId })),
    ).toEqual({
      capability: { reason: "You already have a personal unit.", status: "disabled" },
      kind: "personal",
    });
  });

  test("a named organisation offers a unit to its members, its owner and the platform", () => {
    for (const authority of [
      { caller: { isPlatformAdministrator: false, username: member } },
      {
        caller: { isPlatformAdministrator: false, username: owner },
        organisation: organisation({ caller_is_member: false }),
      },
      {
        caller: { isPlatformAdministrator: true, username: stranger },
        organisation: organisation({ caller_is_member: false }),
      },
    ]) {
      expect(decideIndexUnitOffer(facts(authority))).toEqual({
        capability: { status: "enabled" },
        kind: "named",
      });
    }
  });

  test("a caller who belongs to none of the organisation is refused with its reason", () => {
    expect(
      decideIndexUnitOffer(
        facts({
          caller: { isPlatformAdministrator: false, username: stranger },
          organisation: organisation({ caller_is_member: false }),
        }),
      ),
    ).toEqual({
      capability: {
        reason: "You must be a member or the owner of this organisation.",
        status: "disabled",
      },
      kind: "named",
    });
  });

  test("stale facts leave the action available and name the server as the authority", () => {
    expect(decideIndexUnitOffer(facts({ freshness: "stale" }))).toEqual({
      capability: unconfirmed,
      kind: "named",
    });
    expect(
      decideIndexUnitOffer(facts({ ...workingAsDefaultOrganisation, freshness: "stale" })),
    ).toEqual({ capability: unconfirmed, kind: "personal" });
  });

  test("an organisation no read of the caller's names establishes nothing about their authority", () => {
    expect(decideIndexUnitOffer(facts({ organisation: undefined }))).toEqual({
      capability: unconfirmed,
      kind: "named",
    });
  });

  test("no offer is named until the default organisation has been told apart from the rest", () => {
    // Which unit an organisation holds is settled by whether it is the default one, so an unread
    // default organisation names no offer rather than falling through to the named arm and
    // offering a caller standing in the default organisation a unit it cannot hold.
    const unread = { defaultOrganisationId: undefined, freshness: "stale" as const };
    expect(decideIndexUnitOffer(facts(unread))).toBeUndefined();
    expect(
      decideIndexUnitOffer(facts({ ...unread, ...workingAsDefaultOrganisation })),
    ).toBeUndefined();
  });

  test("a deployment with no default organisation still offers units in the ones it has", () => {
    // A settled read that names no default organisation is an answer, not a gap.
    expect(decideIndexUnitOffer(facts({ defaultOrganisationId: undefined }))).toEqual({
      capability: { status: "enabled" },
      kind: "named",
    });
  });

  test("no offer is named while the organisation in effect is unknown", () => {
    expect(decideIndexUnitOffer(facts({ organisationId: undefined }))).toBeUndefined();
    // Not even the personal unit, which is the caller's own: an unaddressed offer belongs to no
    // organisation, and the index states one organisation at a time.
    expect(
      decideIndexUnitOffer(facts({ organisation: undefined, organisationId: undefined })),
    ).toBeUndefined();
  });

  test("the offer follows the organisation in effect rather than the caller alone", () => {
    const caller = { caller: { isPlatformAdministrator: false, username: member }, personalUnitId };
    expect(decideIndexUnitOffer(facts(caller))?.kind).toBe("named");
    expect(decideIndexUnitOffer(facts({ ...caller, ...workingAsDefaultOrganisation }))?.kind).toBe(
      "personal",
    );
  });
});

test.describe("The organisation the offer speaks for", () => {
  const indexed = organisation({ caller_is_member: false, owner_id: stranger });
  const grouped = organisation();

  test("the caller's own organisation index names the organisation in effect", () => {
    expect(resolveOrganisationAuthorityFacts(organisationId, [indexed], [])).toEqual(indexed);
  });

  test("an organisation only the caller's units name is still named by them", () => {
    // The default organisation is exactly this: no organisation index lists it, its own addressed
    // read is refused, and the group holding the caller's personal unit is what names it.
    expect(
      resolveOrganisationAuthorityFacts(organisationId, [], [{ organisation: grouped }]),
    ).toEqual(grouped);
  });

  test("the organisation's own index entry is preferred to the ancestry a unit reports", () => {
    expect(
      resolveOrganisationAuthorityFacts(organisationId, [indexed], [{ organisation: grouped }]),
    ).toEqual(indexed);
  });

  test("an organisation neither read names is left unestablished rather than assumed hostile", () => {
    expect(resolveOrganisationAuthorityFacts(organisationId, [], [])).toBeUndefined();
    expect(resolveOrganisationAuthorityFacts(undefined, [indexed], [])).toBeUndefined();
    expect(resolveOrganisationAuthorityFacts(organisationId, undefined, undefined)).toBeUndefined();
  });
});

test.describe("The names a new unit is refused for clashing with", () => {
  const units = {
    units: [
      {
        count: 2,
        organisation: { id: organisationId, name: "Acceptance Organisation" },
        units: [{ id: "unit-one", name: "Discovery" }],
      },
      {
        count: 1,
        organisation: { id: defaultOrganisationId, name: "Default Organisation" },
        units: [{ id: personalUnitId, name: "owner@example.org" }],
      },
    ],
  } as UnitsGetResponse;

  test("only the units of the organisation the offer speaks for are counted", () => {
    expect(unitNamesInOrganisation(units, organisationId)).toEqual(["Discovery"]);
    expect(unitNamesInOrganisation(units, defaultOrganisationId)).toEqual(["owner@example.org"]);
  });

  test("an organisation holding no unit the caller can see refuses no name", () => {
    expect(unitNamesInOrganisation(units, "org-unknown")).toEqual([]);
  });
});
