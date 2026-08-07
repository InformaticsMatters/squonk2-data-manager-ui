import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  evaluateOrganisationCreationCapability,
  evaluateOrganisationMembershipCapability,
  evaluateOrganisationPrivacyCapability,
  evaluatePersonalUnitCreationCapability,
  evaluateUnitCreationCapability,
  evaluateUnitDeletionCapability,
  evaluateUnitEditCapability,
  evaluateUnitMembershipCapability,
  evaluateUnitPrivacyCapability,
  isDefaultOrganisationResource,
  isPersonalUnitResource,
} from "../../src/administration/capabilities";
import {
  administrationMutationFailureMessage,
  administrationReadIsAuthoritative,
} from "../../src/administration/failures";
import {
  declaredProductPrivacyExplanation,
  effectiveProductPrivacyExplanation,
  inheritedProductPrivacyExplanation,
  productPrivacyIsEnforced,
  productPrivacyIsPrivate,
  productPrivacyLabel,
  productPrivacyValues,
} from "../../src/administration/privacy";

const organisationId = "org-00000000-0000-4000-8000-000000000001";
const defaultOrganisationId = "org-00000000-0000-4000-8000-0000000000de";
const unitId = "unit-00000000-0000-4000-8000-000000000002";
const personalUnitId = "unit-00000000-0000-4000-8000-0000000000de";

const owner = "owner@example.org";
const member = "member@example.org";
const stranger = "stranger@example.org";

const caller = (username: string | undefined, isPlatformAdministrator = false) => ({
  isPlatformAdministrator,
  username,
});

const organisationFacts = ({
  callerIsMember = true,
  isDefaultOrganisation = false,
  ownerId = owner as string | undefined,
  username = owner as string | undefined,
  isPlatformAdministrator = false,
}) => ({
  caller: caller(username, isPlatformAdministrator),
  isDefaultOrganisation,
  organisation: { caller_is_member: callerIsMember, id: organisationId, owner_id: ownerId },
});

const unitFacts = ({
  isPersonalUnit = false,
  unitOwnerId = owner,
  unitIsMember = true,
  ...organisation
}: Parameters<typeof organisationFacts>[0] & {
  isPersonalUnit?: boolean;
  unitIsMember?: boolean;
  unitOwnerId?: string;
}) => ({
  ...organisationFacts(organisation),
  isPersonalUnit,
  unit: { caller_is_member: unitIsMember, id: unitId, owner_id: unitOwnerId },
});

const unconfirmed = {
  reason: "Your permission will be confirmed when you use this action.",
  status: "enabled",
};

test.describe("Organisation and unit resource semantics", () => {
  test("personal and default resources are recognised by generated identity alone", () => {
    expect(isPersonalUnitResource(unitId, personalUnitId)).toBe(false);
    expect(isPersonalUnitResource(personalUnitId, personalUnitId)).toBe(true);
    expect(isPersonalUnitResource(personalUnitId, undefined)).toBe(false);
    expect(isDefaultOrganisationResource(organisationId, defaultOrganisationId)).toBe(false);
    expect(isDefaultOrganisationResource(defaultOrganisationId, defaultOrganisationId)).toBe(true);
    expect(isDefaultOrganisationResource(defaultOrganisationId, undefined)).toBe(false);
  });
});

test.describe("Organisation capabilities", () => {
  test("organisation creation is a hidden platform-administrator action", () => {
    expect(evaluateOrganisationCreationCapability(caller(owner))).toEqual({ status: "hidden" });
    expect(evaluateOrganisationCreationCapability(caller(owner, true))).toEqual({
      status: "enabled",
    });
  });

  test("organisation creation stays hidden until the caller resource names an owner", () => {
    expect(evaluateOrganisationCreationCapability(caller(undefined, true))).toEqual({
      status: "hidden",
    });
  });

  test("organisation members require ownership or platform authority", () => {
    expect(evaluateOrganisationMembershipCapability(organisationFacts({}))).toEqual({
      status: "enabled",
    });
    expect(
      evaluateOrganisationMembershipCapability(
        organisationFacts({ isPlatformAdministrator: true, username: stranger }),
      ),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateOrganisationMembershipCapability(organisationFacts({ username: member })),
    ).toEqual({ reason: "You must be the owner of this organisation.", status: "disabled" });
  });

  test("default organisation membership and privacy are owned by the platform", () => {
    const defaultOrganisation = organisationFacts({
      isDefaultOrganisation: true,
      isPlatformAdministrator: true,
      ownerId: undefined,
    });
    expect(evaluateOrganisationMembershipCapability(defaultOrganisation)).toEqual({
      reason: "The default organisation does not have members.",
      status: "disabled",
    });
    expect(evaluateOrganisationPrivacyCapability(defaultOrganisation)).toEqual({
      reason: "The default organisation's project privacy is managed by the platform.",
      status: "disabled",
    });
  });

  test("organisation privacy follows the generated patch authority rather than ownership", () => {
    expect(evaluateOrganisationPrivacyCapability(organisationFacts({ username: member }))).toEqual({
      status: "enabled",
    });
    expect(
      evaluateOrganisationPrivacyCapability(
        organisationFacts({ callerIsMember: false, username: owner }),
      ),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateOrganisationPrivacyCapability(
        organisationFacts({ isPlatformAdministrator: true, username: stranger }),
      ),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateOrganisationPrivacyCapability(
        organisationFacts({ callerIsMember: false, username: stranger }),
      ),
    ).toEqual({
      reason: "You must be a member or the owner of this organisation.",
      status: "disabled",
    });
  });

  test("unit creation follows organisation membership", () => {
    expect(evaluateUnitCreationCapability(organisationFacts({ username: member }))).toEqual({
      status: "enabled",
    });
    expect(
      evaluateUnitCreationCapability(organisationFacts({ callerIsMember: false, username: owner })),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateUnitCreationCapability(
        organisationFacts({ callerIsMember: false, username: stranger }),
      ),
    ).toEqual({
      reason: "You must be a member or the owner of this organisation.",
      status: "disabled",
    });
  });

  test("the default organisation only accepts personal units", () => {
    expect(
      evaluateUnitCreationCapability(
        organisationFacts({ isDefaultOrganisation: true, isPlatformAdministrator: true }),
      ),
    ).toEqual({
      reason: "The default organisation only contains personal units.",
      status: "disabled",
    });
  });

  test("personal unit creation depends on the generated personal unit resource", () => {
    const inDefaultOrganisation = { isDefaultOrganisation: true };
    expect(
      evaluatePersonalUnitCreationCapability({ ...inDefaultOrganisation, personalUnit: "absent" }),
    ).toEqual({ status: "enabled" });
    expect(
      evaluatePersonalUnitCreationCapability({ ...inDefaultOrganisation, personalUnit: "present" }),
    ).toEqual({ reason: "You already have a personal unit.", status: "disabled" });
    expect(
      evaluatePersonalUnitCreationCapability({
        ...inDefaultOrganisation,
        freshness: "stale",
        personalUnit: "present",
      }),
    ).toEqual(unconfirmed);
  });

  test("personal unit creation is hidden outside the default organisation", () => {
    expect(
      evaluatePersonalUnitCreationCapability({
        isDefaultOrganisation: false,
        personalUnit: "absent",
      }),
    ).toEqual({ status: "hidden" });
  });
});

test.describe("Unit capabilities", () => {
  test("unit edits follow unit or organisation membership", () => {
    expect(evaluateUnitEditCapability(unitFacts({ username: member }))).toEqual({
      status: "enabled",
    });
    expect(
      evaluateUnitEditCapability(
        unitFacts({ callerIsMember: false, unitIsMember: false, username: owner }),
      ),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateUnitEditCapability(
        unitFacts({ callerIsMember: false, unitIsMember: false, username: stranger }),
      ),
    ).toEqual({
      reason: "You must be a member of this unit or its organisation.",
      status: "disabled",
    });
  });

  test("personal units explain why they cannot be reconfigured", () => {
    expect(
      evaluateUnitEditCapability(unitFacts({ isDefaultOrganisation: true, isPersonalUnit: true })),
    ).toEqual({ reason: "Personal units cannot be renamed or reconfigured.", status: "disabled" });
    expect(
      evaluateUnitMembershipCapability(
        unitFacts({ isDefaultOrganisation: true, isPersonalUnit: true }),
      ),
    ).toEqual({ reason: "Members of a personal unit cannot be changed.", status: "disabled" });
  });

  test("unit membership requires unit or organisation membership", () => {
    expect(evaluateUnitMembershipCapability(unitFacts({ username: member }))).toEqual({
      status: "enabled",
    });
    expect(
      evaluateUnitMembershipCapability(
        unitFacts({ callerIsMember: false, unitIsMember: false, username: stranger }),
      ),
    ).toEqual({
      reason: "You must be a unit or organisation member to change unit members.",
      status: "disabled",
    });
  });

  test("unit deletion requires unit ownership or platform authority", () => {
    expect(evaluateUnitDeletionCapability(unitFacts({ username: owner }))).toEqual({
      status: "enabled",
    });
    expect(
      evaluateUnitDeletionCapability(
        unitFacts({ isPlatformAdministrator: true, username: stranger }),
      ),
    ).toEqual({ status: "enabled" });
    expect(evaluateUnitDeletionCapability(unitFacts({ username: member }))).toEqual({
      reason: "You must be the unit owner to delete this unit.",
      status: "disabled",
    });
  });

  test("personal units remain deletable by their owner", () => {
    expect(
      evaluateUnitDeletionCapability(
        unitFacts({ isDefaultOrganisation: true, isPersonalUnit: true, username: owner }),
      ),
    ).toEqual({ status: "enabled" });
  });

  test("units readable outside the caller's organisations evaluate on unit facts alone", () => {
    const withoutOrganisation = (unit: { caller_is_member: boolean; owner_id: string }) => ({
      caller: caller(member),
      isDefaultOrganisation: false,
      isPersonalUnit: false,
      unit: { ...unit, id: unitId },
    });

    expect(
      evaluateUnitEditCapability(withoutOrganisation({ caller_is_member: true, owner_id: owner })),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateUnitDeletionCapability(
        withoutOrganisation({ caller_is_member: true, owner_id: member }),
      ),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateUnitMembershipCapability(
        withoutOrganisation({ caller_is_member: false, owner_id: owner }),
      ),
    ).toEqual({
      reason: "You must be a unit or organisation member to change unit members.",
      status: "disabled",
    });
  });

  test("unit privacy stays available and explains an organisation requirement", () => {
    expect(evaluateUnitPrivacyCapability(unitFacts({ username: member }))).toEqual({
      status: "enabled",
    });
    expect(
      evaluateUnitPrivacyCapability({
        ...unitFacts({ username: member }),
        organisationPrivacy: "DEFAULT_PUBLIC",
      }),
    ).toEqual({ status: "enabled" });
    expect(
      evaluateUnitPrivacyCapability({
        ...unitFacts({ username: member }),
        organisationPrivacy: "ALWAYS_PRIVATE",
      }),
    ).toEqual({
      reason:
        "The organisation requires Always Private, so a value that conflicts with it is rejected.",
      status: "enabled",
    });
  });

  test("unit privacy refuses before it explains anything about its organisation", () => {
    expect(
      evaluateUnitPrivacyCapability({
        ...unitFacts({ callerIsMember: false, unitIsMember: false, username: stranger }),
        organisationPrivacy: "ALWAYS_PRIVATE",
      }),
    ).toEqual({
      reason: "You must be a member of this unit or its organisation.",
      status: "disabled",
    });
    expect(
      evaluateUnitPrivacyCapability({
        ...unitFacts({ isDefaultOrganisation: true, isPersonalUnit: true }),
        organisationPrivacy: "ALWAYS_PRIVATE",
      }),
    ).toEqual({ reason: "Personal units cannot be renamed or reconfigured.", status: "disabled" });
    expect(
      evaluateUnitPrivacyCapability({
        ...unitFacts({ username: member }),
        freshness: "stale",
        organisationPrivacy: "ALWAYS_PRIVATE",
      }),
    ).toEqual(unconfirmed);
  });

  test("unresolved and stale facts remain discoverable for authoritative evaluation", () => {
    const deniedFacts = unitFacts({
      callerIsMember: false,
      unitIsMember: false,
      username: stranger,
    });
    const incomplete = [
      // The caller resource has not answered yet, so nothing about authority is known.
      { ...deniedFacts, caller: caller(undefined) },
      // Every fact is present but refetching, so the displayed authority may already be wrong.
      { ...deniedFacts, freshness: "stale" as const },
    ];
    for (const facts of incomplete) {
      expect(evaluateOrganisationMembershipCapability(facts)).toEqual(unconfirmed);
      expect(evaluateUnitCreationCapability(facts)).toEqual(unconfirmed);
      expect(evaluateOrganisationPrivacyCapability(facts)).toEqual(unconfirmed);
      for (const evaluate of [
        evaluateUnitEditCapability,
        evaluateUnitMembershipCapability,
        evaluateUnitPrivacyCapability,
        evaluateUnitDeletionCapability,
      ]) {
        expect(evaluate(facts)).toEqual(unconfirmed);
      }
    }
  });

  test("platform-only actions stay hidden while facts are incomplete", () => {
    expect(evaluateOrganisationCreationCapability(caller(undefined))).toEqual({ status: "hidden" });
  });
});

test.describe("Default, inherited, and effective product privacy", () => {
  test("the generated values are the only list, and state their own requirement and visibility", () => {
    expect(productPrivacyValues).toEqual([
      "ALWAYS_PUBLIC",
      "ALWAYS_PRIVATE",
      "DEFAULT_PUBLIC",
      "DEFAULT_PRIVATE",
    ]);
    expect(productPrivacyValues.filter(productPrivacyIsEnforced)).toEqual([
      "ALWAYS_PUBLIC",
      "ALWAYS_PRIVATE",
    ]);
    expect(productPrivacyValues.filter(productPrivacyIsPrivate)).toEqual([
      "ALWAYS_PRIVATE",
      "DEFAULT_PRIVATE",
    ]);
    expect(productPrivacyValues.map((privacy) => productPrivacyLabel(privacy))).toEqual([
      "Always Public",
      "Always Private",
      "Default Public",
      "Default Private",
    ]);
  });

  /**
   * The generated organisation patch states that an existing unit's own default is honoured and a
   * new organisation value applies to new units, so no organisation value ever restates what a
   * unit's projects take.
   */
  test("what new projects take is the unit's own default, whatever its organisation declares", () => {
    for (const unit of productPrivacyValues) {
      const expected = productPrivacyIsEnforced(unit)
        ? `New projects in this unit are always ${productPrivacyIsPrivate(unit) ? "private" : "public"}, because this unit's default is ${productPrivacyLabel(unit)}.`
        : `New projects in this unit start ${productPrivacyIsPrivate(unit) ? "private" : "public"}, and their creator may choose otherwise.`;
      expect(effectiveProductPrivacyExplanation(unit)).toBe(expected);
    }
    expect(effectiveProductPrivacyExplanation("DEFAULT_PRIVATE")).toBe(
      "New projects in this unit start private, and their creator may choose otherwise.",
    );
    expect(effectiveProductPrivacyExplanation("ALWAYS_PUBLIC")).toBe(
      "New projects in this unit are always public, because this unit's default is Always Public.",
    );
  });

  test("an organisation states what it starts new units from and what it leaves alone", () => {
    expect(declaredProductPrivacyExplanation("ALWAYS_PRIVATE")).toBe(
      "Units created from now on start from Always Private, which this organisation requires. Existing units keep the default they already declare.",
    );
    expect(declaredProductPrivacyExplanation("DEFAULT_PUBLIC")).toBe(
      "Units created from now on start from Default Public. Existing units keep the default they already declare.",
    );
  });

  test("a unit states what it inherits without predicting which values conflict", () => {
    expect(inheritedProductPrivacyExplanation("ALWAYS_PRIVATE")).toBe(
      "The organisation requires Always Private. This unit's own default governs its projects, and a change that conflicts with the organisation is rejected.",
    );
    expect(inheritedProductPrivacyExplanation("DEFAULT_PUBLIC")).toBe(
      "The organisation's declared default is Default Public. It starts off new units; this unit's own default governs its projects.",
    );
  });

  test("unreadable ancestry claims nothing about inheritance", () => {
    expect(inheritedProductPrivacyExplanation(undefined)).toBe(
      "This unit's organisation is not readable, so its declared default is unknown.",
    );
    // The unit still answers for its own projects, because that never depended on its ancestry.
    expect(effectiveProductPrivacyExplanation("DEFAULT_PRIVATE")).toBe(
      "New projects in this unit start private, and their creator may choose otherwise.",
    );
  });
});

test.describe("Organisation & access resource semantics have no configured names", () => {
  const administrationSource = path.resolve(__dirname, "../../src/administration");

  test("no Administration source decides personal or default behavior from a name or the environment", () => {
    const sources = readdirSync(administrationSource, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
      .map((file) => ({ file, text: readFileSync(path.join(administrationSource, file), "utf8") }));
    expect(sources.length).toBeGreaterThan(0);

    for (const { file, text } of sources) {
      expect(text, `${file} reads the environment`).not.toMatch(/process\.env/u);
      // A name is displayed content: it is never compared, matched, or searched to decide meaning.
      expect(text, `${file} tests a name`).not.toMatch(
        /\bnames?\s*(?:===|!==)\s*["'`]|\bname\.(?:startsWith|endsWith|includes|match|test)\b/u,
      );
    }

    // The modules that decide what a resource is never read a name at all.
    for (const decider of ["accessFacts.ts", "capabilities.ts", "privacy.ts"]) {
      const text = sources.find(({ file }) => file === decider)?.text;
      expect(text, `${decider} is missing`).toBeDefined();
      expect(text, `${decider} reads a resource name`).not.toMatch(/\.name\b/u);
    }
  });
});

const httpFailure = (status: number) => ({ isAxiosError: true, response: { status } });

test.describe("Administration mutation failures", () => {
  const resource = `unit ${unitId}`;

  test("access denial names the retained resource without disclosing existence", () => {
    expect(administrationMutationFailureMessage(httpFailure(403), "rename", resource)).toBe(
      `You no longer have permission to rename ${resource}. The displayed resource has not changed.`,
    );
  });

  test("confirmed absence keeps the displayed resource unchanged", () => {
    expect(administrationMutationFailureMessage(httpFailure(404), "delete", resource)).toBe(
      `${resource} is no longer available. The displayed resource has not changed.`,
    );
  });

  test("transient failures remain retryable in place", () => {
    for (const status of [429, 500, 503]) {
      expect(administrationMutationFailureMessage(httpFailure(status), "update", resource)).toBe(
        `Could not update ${resource}. The displayed resource has not changed; retry is available.`,
      );
    }
    const network = { isAxiosError: true, code: "ERR_NETWORK" };
    expect(administrationMutationFailureMessage(network, "update", resource)).toBe(
      `Could not update ${resource}. The displayed resource has not changed; retry is available.`,
    );
  });

  test("unknown failures fall back to the shared error presentation", () => {
    expect(administrationMutationFailureMessage(new Error("boom"), "update", resource)).toBe(
      undefined,
    );
  });
});

test.describe("Administration read failures", () => {
  test("access denial and confirmed absence are answered by the addressed resource", () => {
    expect(administrationReadIsAuthoritative(httpFailure(403))).toBe(true);
    expect(administrationReadIsAuthoritative(httpFailure(404))).toBe(true);
  });

  test("transient and unclassified failures stay with the task retry boundary", () => {
    for (const status of [429, 500, 503]) {
      expect(administrationReadIsAuthoritative(httpFailure(status))).toBe(false);
    }
    expect(administrationReadIsAuthoritative({ isAxiosError: true, code: "ERR_NETWORK" })).toBe(
      false,
    );
    expect(administrationReadIsAuthoritative(new Error("boom"))).toBe(false);
  });
});
