import { type OrganisationAllDetail } from "@/api/account-server";

import { isDefaultOrganisationResource } from "../application/organisationUnits";

/**
 * What the organisation in the masthead means for the Administration workspace.
 *
 * The organisation is ambient here: `/administration` is that organisation's own page, and every
 * unit beneath it belongs to it. Two rules follow from that, and both are decided here rather than
 * at the screens that consult them.
 */

/**
 * Whether the organisation in effect is the platform's default organisation.
 *
 * This is the one predicate the family's two default-organisation special cases consult — the
 * overview omitting members and privacy it cannot read, and the rail withholding a Charges entry
 * the Account Server refuses outright. A third special case collapses into this one rather than
 * becoming a third scattered check.
 */
export const organisationInEffectIsDefault = (
  organisationId: string | undefined,
  defaultOrganisationId: string | undefined,
): boolean =>
  organisationId !== undefined &&
  isDefaultOrganisationResource(organisationId, defaultOrganisationId);

/**
 * Whether the organisation in effect has a charge ledger to offer at all. The Account Server
 * refuses organisation charges for the default organisation for every caller, so the entry is
 * hidden rather than offered and then refused.
 */
export const organisationChargesAreOffered = (
  organisationId: string | undefined,
  defaultOrganisationId: string | undefined,
): boolean => !organisationInEffectIsDefault(organisationId, defaultOrganisationId);

/**
 * What a unit URL means for the organisation the caller is working as.
 *
 * `in-effect` is the ordinary case. `adopt` is a link followed into another organisation the
 * caller's own grouped unit index already names, which is the only source of a unit's parent: the
 * unit resource itself carries none, and probing the organisation-scoped units endpoint across
 * organisations is forbidden — it is owner discovery, and it would leak resource existence.
 * `unknown` is the accepted cost of that: the unit still opens, without ancestry and without
 * changing which organisation the caller is working as.
 */
export type UnitOrganisationScope =
  | { kind: "adopt"; organisation: OrganisationAllDetail }
  | { kind: "in-effect"; organisation: OrganisationAllDetail }
  | { kind: "unknown" };

export const resolveUnitOrganisationScope = ({
  organisationIdInEffect,
  unitGroups,
  unitId,
}: {
  /** The organisation named in the masthead, absent while none is in effect. */
  organisationIdInEffect: string | undefined;
  /** The caller's own grouped unit index, absent while it has not answered. */
  unitGroups:
    | readonly { organisation: OrganisationAllDetail; units: readonly { id: string }[] }[]
    | undefined;
  unitId: string;
}): UnitOrganisationScope => {
  const group = unitGroups?.find(({ units }) => units.some((unit) => unit.id === unitId));
  if (!group) {
    return { kind: "unknown" };
  }
  return group.organisation.id === organisationIdInEffect
    ? { kind: "in-effect", organisation: group.organisation }
    : { kind: "adopt", organisation: group.organisation };
};
