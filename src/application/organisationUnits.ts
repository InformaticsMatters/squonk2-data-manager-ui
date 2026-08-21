import { type OrganisationAllDetail } from "@/api/account-server";

import {
  type Capability,
  type CapabilityFacts,
  capabilityFactsAreConfirmed as factsAreConfirmed,
  unconfirmedCapability,
} from "./capability";

/**
 * The organisation and unit rules more than one route family needs: who may act on an organisation,
 * which unit an organisation holds for a caller, and how the caller's own reads name the
 * organisation they are working as.
 *
 * Administration offers unit creation from an organisation it is displaying, and Projects offers it
 * beside **Create project** on the projects index. Both answer the same question about the same
 * generated endpoints, so the predicates behind that question are defined once here and imported by
 * both. ADR 0002 rules out the alternative — Projects reaching into Administration's
 * implementation — and ADR 0003 provides for this one: "only small predicates are shared, and only
 * after the generated semantics behind them are demonstrably common". It is the same reason
 * `useCreatePersonalUnitCommand` already sits above the families.
 *
 * ADR 0002's own collapse threshold is three families. This is two, and it is hoisted anyway
 * because the third option the ADR leaves — duplicating the rule — would let Administration and
 * Projects drift apart about who may create a unit, which is the drift the offer exists to avoid.
 *
 * Nothing here is security. A capability decides what a screen offers; the Account Server decides
 * what it accepts. See `docs/adr/0003-capabilities-are-presentation.md`.
 */

/** `stale` covers both unresolved and refetching generated facts; neither confirms authority. */
export type UnitCreationFreshness = "current" | "stale";

export type UnitCreationCaller = { isPlatformAdministrator: boolean; username?: string };

/**
 * What an organisation itself says about the caller. Only the generated membership and ownership
 * fields are read, so no rule below depends on an organisation's name.
 */
export type OrganisationAuthorityFacts = Pick<
  OrganisationAllDetail,
  "caller_is_member" | "id" | "owner_id"
>;

export type OrganisationUnitCreationFacts = CapabilityFacts<UnitCreationFreshness> & {
  caller: UnitCreationCaller;
  /** Resolved from the generated default organisation resource, never from a name. */
  isDefaultOrganisation: boolean;
  organisation: OrganisationAuthorityFacts;
};

export type PersonalUnitCreationFacts = {
  freshness?: UnitCreationFreshness;
  /** Personal units only exist in the default organisation, so every other one hides the action. */
  isDefaultOrganisation: boolean;
  personalUnit: "absent" | "present";
};

export const isDefaultOrganisationResource = (
  organisationId: string,
  defaultOrganisationId: string | undefined,
): boolean => defaultOrganisationId !== undefined && defaultOrganisationId === organisationId;

/**
 * What the generated organisation endpoints accept from a member, an owner, or the platform.
 *
 * Unit creation answers to this, and so does every other organisation action Administration offers,
 * which is why it is defined once here rather than in each of them.
 */
export const evaluateOrganisationAuthority = ({
  caller,
  organisation,
}: {
  caller: UnitCreationCaller;
  organisation: OrganisationAuthorityFacts;
}): Capability =>
  caller.isPlatformAdministrator ||
  organisation.owner_id === caller.username ||
  organisation.caller_is_member
    ? { status: "enabled" }
    : { status: "disabled", reason: "You must be a member or the owner of this organisation." };

/**
 * Whether a unit may be created in the addressed organisation. The default organisation holds only
 * personal units, so it refuses this action and names the reason rather than hiding it: the caller
 * is standing in an organisation that does take a unit of a different kind.
 */
export const evaluateUnitCreationCapability = (
  facts: OrganisationUnitCreationFacts,
): Capability => {
  if (!factsAreConfirmed(facts)) {
    return unconfirmedCapability;
  }
  return facts.isDefaultOrganisation
    ? { status: "disabled", reason: "The default organisation only contains personal units." }
    : evaluateOrganisationAuthority(facts);
};

/**
 * Whether the caller may take the personal unit the default organisation holds for them. It needs
 * no organisation membership — the Account Server gives every authorised caller exactly one — so
 * the only questions are which organisation is addressed and whether that unit already exists.
 */
export const evaluatePersonalUnitCreationCapability = ({
  freshness = "current",
  isDefaultOrganisation,
  personalUnit,
}: PersonalUnitCreationFacts): Capability => {
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

/**
 * Everything a unit-creation offer for one organisation is decided from: the caller's own account
 * facts, which organisation is in effect, and what their reads say about that organisation.
 *
 * `organisationId` is the organisation the caller is working as rather than one in a URL — a unit
 * is billing context and never a browsing scope — so it is supplied by whoever knows it. It is
 * `undefined` while the organisation in effect is not yet known, which is an identity question
 * rather than an authority one.
 */
export type UnitCreationFacts = {
  caller: UnitCreationCaller;
  defaultOrganisationId?: string;
  freshness: UnitCreationFreshness;
  /** Absent where no read the caller may make names the organisation in effect. */
  organisation?: OrganisationAuthorityFacts;
  organisationId?: string;
  personalUnitId?: string;
};

/**
 * What the caller's own reads say about the organisation they are working as.
 *
 * The addressed organisation resource is deliberately not consulted: `GET /organisation/{id}`
 * answers `403` for an ordinary caller addressing the **default organisation**, which would read as
 * "not a member" and refuse an action that organisation does not require membership for. The
 * caller's own organisation index carries membership and ownership for every named organisation
 * they may work as, and their grouped unit index names any organisation they hold a unit in —
 * including the default one, which no organisation index ever lists.
 *
 * An organisation neither read names is left undefined rather than assumed hostile, so the caller
 * of this function decides what an unestablished authority means for the action it governs.
 */
export const resolveOrganisationAuthorityFacts = (
  organisationId: string | undefined,
  organisations: readonly OrganisationAuthorityFacts[] | undefined,
  unitGroups: readonly { organisation: OrganisationAuthorityFacts }[] | undefined,
): OrganisationAuthorityFacts | undefined => {
  if (organisationId === undefined) {
    return undefined;
  }
  return (
    organisations?.find(({ id }) => id === organisationId) ??
    unitGroups?.find(({ organisation }) => organisation.id === organisationId)?.organisation
  );
};
