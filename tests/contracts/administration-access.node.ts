import { expect, test } from "@playwright/test";

import {
  evaluateOrganisationCreationCapability,
  evaluateOrganisationEditorCapability,
  evaluatePersonalUnitCreationCapability,
  evaluateUnitCreationCapability,
  evaluateUnitDeletionCapability,
  evaluateUnitEditCapability,
  evaluateUnitMembershipCapability,
  isDefaultOrganisationResource,
  isPersonalUnitResource,
} from "../../src/administration/capabilities";
import {
  administrationMutationFailureMessage,
  administrationReadIsAuthoritative,
} from "../../src/administration/failures";

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

  test("organisation editors require ownership or platform authority", () => {
    expect(evaluateOrganisationEditorCapability(organisationFacts({}))).toEqual({
      status: "enabled",
    });
    expect(
      evaluateOrganisationEditorCapability(
        organisationFacts({ isPlatformAdministrator: true, username: stranger }),
      ),
    ).toEqual({ status: "enabled" });
    expect(evaluateOrganisationEditorCapability(organisationFacts({ username: member }))).toEqual({
      reason: "You must be the owner of this organisation.",
      status: "disabled",
    });
  });

  test("default organisation editors are owned by the platform", () => {
    expect(
      evaluateOrganisationEditorCapability(
        organisationFacts({
          isDefaultOrganisation: true,
          isPlatformAdministrator: true,
          ownerId: undefined,
        }),
      ),
    ).toEqual({ reason: "The default organisation does not have editors.", status: "disabled" });
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
      expect(evaluateOrganisationEditorCapability(facts)).toEqual(unconfirmed);
      expect(evaluateUnitCreationCapability(facts)).toEqual(unconfirmed);
      for (const evaluate of [
        evaluateUnitEditCapability,
        evaluateUnitMembershipCapability,
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
