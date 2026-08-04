import { type OrganisationAllDetail, type UnitAllDetail } from "@/api/account-server";

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

export const evaluateOrganisationEditorCapability = (
  facts: OrganisationCapabilityFacts,
): AdministrationCapability => {
  if (!factsAreConfirmed(facts)) {
    return unconfirmed;
  }
  if (facts.isDefaultOrganisation) {
    return { status: "disabled", reason: "The default organisation does not have editors." };
  }
  if (
    facts.caller.isPlatformAdministrator ||
    facts.organisation.owner_id === facts.caller.username
  ) {
    return { status: "enabled" };
  }
  return { status: "disabled", reason: "You must be the owner of this organisation." };
};

export const evaluateUnitCreationCapability = (
  facts: OrganisationCapabilityFacts,
): AdministrationCapability => {
  if (!factsAreConfirmed(facts)) {
    return unconfirmed;
  }
  if (facts.isDefaultOrganisation) {
    return { status: "disabled", reason: "The default organisation only contains personal units." };
  }
  if (
    facts.caller.isPlatformAdministrator ||
    facts.organisation.owner_id === facts.caller.username ||
    facts.organisation.caller_is_member
  ) {
    return { status: "enabled" };
  }
  return { status: "disabled", reason: "You must be a member or the owner of this organisation." };
};

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
    return { status: "disabled", reason: "Personal units cannot be renamed or reconfigured." };
  }
  return evaluateUnitAuthority(facts);
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
