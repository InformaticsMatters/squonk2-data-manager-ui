import { type OrganisationAllDetail, type UnitAllDetail } from "@/api/account-server";

import {
  type Capability,
  type CapabilityFacts,
  capabilityFactsAreConfirmed as factsAreConfirmed,
  unconfirmedCapability,
} from "../application/capability";
import {
  enforcedProductPrivacyConstraint,
  type ProductPrivacy,
  productPrivacyIsEnforced,
} from "./privacy";

/** Administration answers in the shared capability shape; the rules below are the family's own. */
export type AdministrationCapability = Capability;

/**
 * The shared capability vocabulary, offered under Administration's own names so that its features
 * have one place to import from. `unconfirmedCapability` is what every Administration capability
 * answers with when the facts behind it have not been established.
 */
export {
  capabilityReason,
  capabilityFactsAreConfirmed as factsAreConfirmed,
  unconfirmedCapability,
} from "../application/capability";

/** `stale` covers both unresolved and refetching generated facts; neither confirms authority. */
export type AccessFactsFreshness = "current" | "stale";

export type AccessCaller = { isPlatformAdministrator: boolean; username?: string };

export type OrganisationCapabilityFacts = CapabilityFacts<AccessFactsFreshness> & {
  caller: AccessCaller;
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

/** A personal unit is the caller's own; the Account Server owns everything it declares. */
const personalUnitIsFixed: AdministrationCapability = {
  status: "disabled",
  reason: "Personal units cannot be renamed or reconfigured.",
};

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
    return unconfirmedCapability;
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
 * Who the organisation's member list displays but never offers to remove.
 *
 * This is a deliberate narrowing of the generated contract, and the only one Organisation & access
 * makes. `DELETE /organisation/{orgId}/user/{userId}` accepts either removal from any caller in the
 * organisation, so neither is refused by the server and neither is hidden from a caller who reaches
 * the endpoint another way:
 *
 * - The caller itself, because removing it would take away the organisation it is standing on, and
 *   only a remaining member or an administrator could put it back.
 * - The organisation's owner, because the resource keeps naming an owner the list no longer holds.
 *
 * Leaving is a real thing to want, so it belongs in an action that says what it costs and confirms
 * it, rather than in a chip that removes a member without asking.
 */
export const protectedOrganisationMembers = ({
  caller,
  organisation,
}: Pick<OrganisationCapabilityFacts, "caller" | "organisation">): string[] => [
  ...new Set([organisation.owner_id, caller.username].filter((user) => user !== undefined)),
];

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
    return unconfirmedCapability;
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
    return unconfirmedCapability;
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
    return unconfirmedCapability;
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
    return unconfirmedCapability;
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
    return unconfirmedCapability;
  }
  if (facts.caller.isPlatformAdministrator || facts.unit.owner_id === facts.caller.username) {
    return { status: "enabled" };
  }
  return { status: "disabled", reason: "You must be the unit owner to delete this unit." };
};
