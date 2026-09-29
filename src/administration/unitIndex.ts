import { type OrganisationUnitsGetResponse, type UnitAllDetail } from "@/api/account-server";

import { administrationLinks } from "./routes";

/**
 * One unit as the rail lists it: where it goes, what it is called, and the facts that tell one unit
 * from another at a glance. Nothing here is decided by the component that renders it, so the
 * ordering, the labelling and the empty states are provable without a browser.
 */
export type UnitIndexRow = {
  href: string;
  /** Resolved from the generated personal unit resource, never from the unit's name. */
  isPersonal: boolean;
  isPrivate: boolean;
  memberCount: number;
  ownerId: string;
  unitId: string;
  unitName: string;
};

/**
 * Why the rail has nothing to list. The two are opposite problems with opposite remedies — an
 * organisation with no units needs one creating, a search that matched nothing needs clearing — so
 * they are distinguished here rather than collapsed into one empty list.
 */
export type UnitIndexEmptiness = "no-matches" | "no-units";

export type UnitIndexList = {
  /** Absent whenever there is something to list. */
  emptiness?: UnitIndexEmptiness;
  rows: UnitIndexRow[];
  /** How many units the organisation holds for this caller, before the search narrowed them. */
  total: number;
};

/** What narrows the rail, beside the organisation the units were read for. */
export type UnitIndexNarrowing = { personalUnitId?: string; search?: string };

const unitRow = (unit: UnitAllDetail, personalUnitId: string | undefined): UnitIndexRow => ({
  href: administrationLinks.unitAccess(unit.id),
  isPersonal: personalUnitId !== undefined && personalUnitId === unit.id,
  isPrivate: unit.private,
  memberCount: unit.users.length,
  ownerId: unit.owner_id,
  unitId: unit.id,
  unitName: unit.name,
});

/**
 * The units of the organisation in effect, as the rail lists them.
 *
 * The read behind it returns the units the caller has access to *or* that are public, so a unit the
 * caller is not a member of is still listed: the rail says what the organisation holds, and
 * authority is answered by the unit's own page rather than by leaving it out of the list.
 *
 * A search matches the unit's name or its identifier — an identifier is what a caller holding a
 * link or a support ticket actually has — and it never reorders the list, so narrowing a list and
 * reading it are the same activity.
 */
export const buildUnitIndex = (
  response: Pick<OrganisationUnitsGetResponse, "units">,
  { personalUnitId, search = "" }: UnitIndexNarrowing = {},
): UnitIndexList => {
  const all = response.units
    .map((unit) => unitRow(unit, personalUnitId))
    .toSorted(
      (left, right) =>
        left.unitName.localeCompare(right.unitName) || left.unitId.localeCompare(right.unitId),
    );
  const term = search.trim().toLocaleLowerCase();
  const rows = term
    ? all.filter(
        (row) =>
          row.unitName.toLocaleLowerCase().includes(term) ||
          row.unitId.toLocaleLowerCase().includes(term),
      )
    : all;

  return {
    ...(rows.length === 0 ? { emptiness: all.length === 0 ? "no-units" : "no-matches" } : {}),
    rows,
    total: all.length,
  };
};
