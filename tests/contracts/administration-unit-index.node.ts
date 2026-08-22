import { type UnitAllDetail } from "@/api/account-server";

import { expect, test } from "@playwright/test";

import { administrationLinks } from "../../src/administration/routes";
import { buildUnitIndex } from "../../src/administration/unitIndex";

const unitId = (suffix: string) => `unit-00000000-0000-4000-8000-00000000000${suffix}`;

const unit = (
  overrides: Partial<UnitAllDetail> & Pick<UnitAllDetail, "id" | "name">,
): UnitAllDetail => ({
  billing_day: 1,
  caller_is_member: true,
  created: "2026-01-02T03:04:05Z",
  default_product_privacy: "DEFAULT_PRIVATE",
  owner_id: "owner",
  private: true,
  users: [{ id: "owner" }],
  ...overrides,
});

const screening = unit({ id: unitId("1"), name: "Screening" });
const analysis = unit({ id: unitId("2"), name: "Analysis", users: [{ id: "owner" }, { id: "b" }] });
const personal = unit({ id: unitId("3"), name: "acceptance-subject", private: false });

test.describe("organisation unit index", () => {
  test("lists every unit of the organisation, ordered by name", () => {
    const { emptiness, rows, total } = buildUnitIndex({ units: [screening, analysis, personal] });

    expect(rows.map(({ unitName }) => unitName)).toEqual([
      "acceptance-subject",
      "Analysis",
      "Screening",
    ]);
    expect(total).toBe(3);
    expect(emptiness).toBeUndefined();
  });

  test("each row addresses that unit's Access section", () => {
    const [row] = buildUnitIndex({ units: [screening] }).rows;

    expect(row.href).toBe(administrationLinks.unitAccess(screening.id));
  });

  test("carries the facts that tell one unit from another", () => {
    const [row] = buildUnitIndex({ units: [analysis] }).rows;

    expect(row).toMatchObject({
      isPrivate: true,
      memberCount: 2,
      ownerId: "owner",
      unitId: analysis.id,
      unitName: "Analysis",
    });
  });

  test("labels the personal unit from the generated resource rather than its name", () => {
    const rows = buildUnitIndex(
      { units: [screening, personal] },
      { personalUnitId: personal.id },
    ).rows;

    expect(rows.find(({ unitId: id }) => id === personal.id)?.isPersonal).toBe(true);
    expect(rows.find(({ unitId: id }) => id === screening.id)?.isPersonal).toBe(false);
    // A unit named exactly like the caller is still not their personal unit.
    expect(buildUnitIndex({ units: [personal] }).rows[0].isPersonal).toBe(false);
  });

  test("a search narrows by name or identifier without reordering", () => {
    const units = { units: [screening, analysis, personal] };

    expect(buildUnitIndex(units, { search: "  scREEN " }).rows.map((row) => row.unitName)).toEqual([
      "Screening",
    ]);
    expect(buildUnitIndex(units, { search: analysis.id }).rows.map((row) => row.unitName)).toEqual([
      "Analysis",
    ]);
    // "e" matches two of the three, and they stay in the order the whole list had them.
    expect(buildUnitIndex(units, { search: "e" }).rows.map((row) => row.unitName)).toEqual([
      "acceptance-subject",
      "Screening",
    ]);
  });

  test("the total counts the organisation rather than the search", () => {
    const narrowed = buildUnitIndex({ units: [screening, analysis] }, { search: "screen" });

    expect(narrowed.rows).toHaveLength(1);
    expect(narrowed.total).toBe(2);
  });

  test("an organisation with no units is told apart from a search that matched none", () => {
    expect(buildUnitIndex({ units: [] })).toMatchObject({ emptiness: "no-units", total: 0 });
    expect(buildUnitIndex({ units: [] }, { search: "anything" })).toMatchObject({
      emptiness: "no-units",
    });
    expect(buildUnitIndex({ units: [screening] }, { search: "nothing" })).toMatchObject({
      emptiness: "no-matches",
      total: 1,
    });
  });

  test("a unit the caller is not a member of is still listed", () => {
    const foreign = unit({ caller_is_member: false, id: unitId("4"), name: "Public Unit" });

    expect(buildUnitIndex({ units: [foreign] }).rows.map(({ unitId: id }) => id)).toEqual([
      foreign.id,
    ]);
  });
});
