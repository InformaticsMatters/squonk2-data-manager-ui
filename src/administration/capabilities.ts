import { type OrganisationAllDetail, type UnitAllDetail } from "@/api/account-server";

import {
  enforcedProductPrivacyConstraint,
  type ProductPrivacy,
  productPrivacyIsEnforced,
} from "./privacy";

export type AdministrationCapability =
  | { status: "disabled"; reason: string }
  | { status: "enabled"; reason?: string }
  | { status: "hidden" };

/** `stale` covers both unresolved and refetching generated facts; neither confirms authority. */
export type AccessFactsFreshness = "current" | "stale";

export type AccessCaller = { isPlatformAdministrator: boolean; username?: string };

export type OrganisationCapabilityFacts = {
  caller: AccessCaller;
  freshness?: AccessFactsFreshness;
  /** Resolved from the generated default organisation resource, never from a name. */
  isDefaultOrganisation: boolean;
  organisation: Pick<OrganisationAllDetail, "caller_is_member" | "id" | "owner_id">;
};

export type UnitCapabilityFacts = Omit<OrganisationCapabilityFacts, "organisation"> & {
  /** Resolved from the generated personal unit resource, never from a name. */
  isPersonalUnit: boolean;
  /** Absent when the addressed unit is readable but its organisation is not. */
  organisation?: OrganisationCapabilityFacts["organisation"];
  unit: Pick<UnitAllDetail, "caller_is_member" | "id" | "owner_id">;
};

export type UnitPrivacyCapabilityFacts = UnitCapabilityFacts & {
  /** The organisation's own default, absent when the unit's ancestry is not readable. */
  organisationPrivacy?: ProductPrivacy;
};

export type PersonalUnitCapabilityFacts = {
  freshness?: AccessFactsFreshness;
  /** Personal units only exist in the default organisation, so every other one hides the action. */
  isDefaultOrganisation: boolean;
  personalUnit: "absent" | "present";
};

const unconfirmed: AdministrationCapability = {
  status: "enabled",
  reason: "Your permission will be confirmed when you use this action.",
};

/** A personal unit is the caller's own; the Account Server owns everything it declares. */
const personalUnitIsFixed: AdministrationCapability = {
  status: "disabled",
  reason: "Personal units cannot be renamed or reconfigured.",
};

const factsAreConfirmed = ({
  caller,
  freshness = "current",
}: Pick<OrganisationCapabilityFacts, "caller" | "freshness">) =>
  freshness === "current" && !!caller.username;

/** Hidden capabilities never explain themselves; every other status may carry a reason. */
export const capabilityReason = (capability: AdministrationCapability): string | undefined =>
  capability.status === "hidden" ? undefined : capability.reason;

export const isDefaultOrganisationResource = (
  organisationId: string,
  defaultOrganisationId: string | undefined,
): boolean => defaultOrganisationId !== undefined && defaultOrganisationId === organisationId;

export const isPersonalUnitResource = (
  unitId: string,
  personalUnitId: string | undefined,
): boolean => personalUnitId !== undefined && personalUnitId === unitId;

export const evaluateOrganisationCreationCapability = (
  caller: AccessCaller,
): AdministrationCapability =>
  caller.isPlatformAdministrator && !!caller.username
    ? { status: "enabled" }
    : { status: "hidden" };

/** What the generated organisation endpoints accept from a member, an owner, or the platform. */
const evaluateOrganisationAuthority = (
  facts: OrganisationCapabilityFacts,
): AdministrationCapability =>
  facts.caller.isPlatformAdministrator ||
  facts.organisation.owner_id === facts.caller.username ||
  facts.organisation.caller_is_member
    ? { status: "enabled" }
    : { status: "disabled", reason: "You must be a member or the owner of this organisation." };

/**
 * Every organisation action the generated endpoints expose answers to that one authority, so each
 * named capability below states only what the default organisation means for it.
 */
const evaluateOrganisationCapability = (
  facts: OrganisationCapabilityFacts,
  defaultOrganisationReason: string,
): AdministrationCapability => {
  if (!factsAreConfirmed(facts)) {
    return unconfirmed;
  }
  return facts.isDefaultOrganisation
    ? { status: "disabled", reason: defaultOrganisationReason }
    : evaluateOrganisationAuthority(facts);
};

/**
 * The generated organisation user endpoints add and remove a member for a caller who is in the
 * organisation or an administrator, so membership follows the same authority its patch does rather
 * than a stricter ownership rule the server would not have enforced.
 */
export const evaluateOrganisationMembershipCapability = (
  facts: OrganisationCapabilityFacts,
): AdministrationCapability =>
  evaluateOrganisationCapability(facts, "The default organisation does not have members.");

/**
 * The generated organisation resource is patched by a member, its owner, or the platform, which is
 * the same authority its membership endpoints require.
 */
export const evaluateOrganisationPrivacyCapability = (
  facts: OrganisationCapabilityFacts,
): AdministrationCapability =>
  evaluateOrganisationCapability(
    facts,
    "The default organisation's project privacy is managed by the platform.",
  );

export const evaluateUnitCreationCapability = (
  facts: OrganisationCapabilityFacts,
): AdministrationCapability =>
  evaluateOrganisationCapability(facts, "The default organisation only contains personal units.");

export const evaluatePersonalUnitCreationCapability = ({
  freshness = "current",
  isDefaultOrganisation,
  personalUnit,
}: PersonalUnitCapabilityFacts): AdministrationCapability => {
  if (!isDefaultOrganisation) {
    return { status: "hidden" };
  }
  if (freshness !== "current") {
    return unconfirmed;
  }
  return personalUnit === "present"
    ? { status: "disabled", reason: "You already have a personal unit." }
    : { status: "enabled" };
};

const evaluateUnitAuthority = (facts: UnitCapabilityFacts): AdministrationCapability => {
  if (
    facts.caller.isPlatformAdministrator ||
    facts.unit.owner_id === facts.caller.username ||
    facts.unit.caller_is_member ||
    facts.organisation?.caller_is_member === true
  ) {
    return { status: "enabled" };
  }
  return { status: "disabled", reason: "You must be a member of this unit or its organisation." };
};

export const evaluateUnitEditCapability = (
  facts: UnitCapabilityFacts,
): AdministrationCapability => {
  if (!factsAreConfirmed(facts)) {
    return unconfirmed;
  }
  if (facts.isPersonalUnit) {
    return personalUnitIsFixed;
  }
  return evaluateUnitAuthority(facts);
};

/**
 * A unit's own default governs its projects and is set by the same authority that edits the unit.
 * An organisation that requires a privacy constrains what this unit may be changed to, so the
 * action stays available and says so: which values conflict is the server's to decide, not a client
 * hint's, and the organisation may stop requiring one at any time.
 */
export const evaluateUnitPrivacyCapability = (
  facts: UnitPrivacyCapabilityFacts,
): AdministrationCapability => {
  if (!factsAreConfirmed(facts)) {
    return unconfirmed;
  }
  if (facts.isPersonalUnit) {
    return personalUnitIsFixed;
  }
  const authority = evaluateUnitAuthority(facts);
  if (authority.status !== "enabled") {
    return authority;
  }
  return facts.organisationPrivacy !== undefined &&
    productPrivacyIsEnforced(facts.organisationPrivacy)
    ? { status: "enabled", reason: enforcedProductPrivacyConstraint(facts.organisationPrivacy) }
    : { status: "enabled" };
};

export const evaluateUnitMembershipCapability = (
  facts: UnitCapabilityFacts,
): AdministrationCapability => {
  if (!factsAreConfirmed(facts)) {
    return unconfirmed;
  }
  if (facts.isPersonalUnit) {
    return { status: "disabled", reason: "Members of a personal unit cannot be changed." };
  }
  const authority = evaluateUnitAuthority(facts);
  return authority.status === "enabled"
    ? authority
    : {
        status: "disabled",
        reason: "You must be a unit or organisation member to change unit members.",
      };
};

export const evaluateUnitDeletionCapability = (
  facts: UnitCapabilityFacts,
): AdministrationCapability => {
  if (!factsAreConfirmed(facts)) {
    return unconfirmed;
  }
  if (facts.caller.isPlatformAdministrator || facts.unit.owner_id === facts.caller.username) {
    return { status: "enabled" };
  }
  return { status: "disabled", reason: "You must be the unit owner to delete this unit." };
};
