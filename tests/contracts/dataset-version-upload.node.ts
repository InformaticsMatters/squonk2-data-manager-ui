import {
  type OrganisationAllDetail,
  type OrganisationUnitsGetResponse,
  type UnitAllDetail,
} from "@/api/account-server";
import {
  type DatasetSummary,
  type DatasetVersionSummary,
  type InventoryUserGetResponse,
} from "@/api/data-manager";

import { expect, test } from "@playwright/test";

import { evaluateDatasetVersionUploadCapability } from "../../src/datasets/capabilities";
import { nextVersionAfterDeletion } from "../../src/datasets/mutations";
import {
  latestDatasetVersion,
  resolveDatasetVersion,
} from "../../src/datasets/resolveDatasetVersion";
import {
  datasetBillingAncestry,
  datasetBillingFreshness,
  datasetInventoryScopes,
  resolveInheritedBillingUnit,
  versionUploadInput,
} from "../../src/datasets/versionBilling";

const created = "2026-01-02T03:04:05Z";
const datasetId = "dataset-11111111-1111-1111-1111-111111111111";
const unitId = "unit-55555555-5555-5555-5555-555555555555";
const otherUnitId = "unit-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const organisationId = "org-22222222-2222-2222-2222-222222222222";
const otherOrganisationId = "org-66666666-6666-6666-6666-666666666666";

const organisation = (id: string, callerIsMember: boolean): OrganisationAllDetail => ({
  caller_is_member: callerIsMember,
  created,
  default_product_privacy: "DEFAULT_PRIVATE",
  id,
  name: `Organisation ${id.slice(4, 8)}`,
  owner_id: "owner",
  private: true,
  users: [],
});

const unit = (id: string, callerIsMember: boolean): UnitAllDetail => ({
  billing_day: 1,
  caller_is_member: callerIsMember,
  created,
  default_product_privacy: "DEFAULT_PRIVATE",
  id,
  name: `Unit ${id.slice(5, 9)}`,
  owner_id: "owner",
  private: true,
  users: [],
});

const groups = (): OrganisationUnitsGetResponse[] => [
  { count: 2, organisation: organisation(organisationId, true), units: [unit(unitId, true)] },
  {
    count: 1,
    organisation: organisation(otherOrganisationId, false),
    units: [unit(otherUnitId, true), unit("unit-cccccccc-cccc-4ccc-8ccc-cccccccccccc", false)],
  },
];

const version = (
  number: number,
  overrides: Partial<DatasetVersionSummary> = {},
): DatasetVersionSummary => ({
  file_name: `acceptance-v${number}.sdf`,
  owner: "acceptance",
  processing_stage: "DONE",
  projects: [],
  published: created,
  source_ref: `acceptance-v${number}.sdf`,
  type: "chemical/x-mdl-sdfile",
  version: number,
  ...overrides,
});

const dataset = (versions: DatasetVersionSummary[]): DatasetSummary => ({
  dataset_id: datasetId,
  editors: ["acceptance"],
  versions,
});

const activity = {
  period_a: { activity: "0%", active_days: 0, inactive_days: 1, monitoring_period: "30 days" },
  total_activity: "0%",
  total_days_active: 0,
  total_days_inactive: 1,
  total_days_since_first_seen: 1,
};

const inventory = (
  datasets: { id: string; unit_id: string; version: number }[],
  role: "editor" | "owner" = "owner",
): InventoryUserGetResponse => ({
  today: "2026-08-12",
  users: [
    {
      activity,
      datasets: {
        [role]: datasets.map(({ id, unit_id, version: datasetVersion }) => ({
          filename: `acceptance-v${datasetVersion}.sdf`,
          id,
          unit_id,
          version: datasetVersion,
        })),
      },
      f_uid: 1,
      first_seen: created,
      last_seen_date: created,
      projects: { administrator: [], editor: [], observer: [] },
      username: "acceptance",
    },
  ],
});

test.describe("Latest dataset version contract", () => {
  test("the highest version is the latest whatever order the Data Manager listed them in", () => {
    expect(latestDatasetVersion([version(2), version(1), version(10)])?.version).toBe(10);
    expect(latestDatasetVersion([version(1)])?.version).toBe(1);
  });

  test("a dataset with no versions has no latest one to name", () => {
    expect(latestDatasetVersion([])).toBeUndefined();
  });

  test("canonicalisation and the deletion destination select the same latest version", () => {
    const versions = [version(2), version(1), version(3)];
    const resolution = resolveDatasetVersion([dataset(versions)], datasetId);
    expect(resolution.kind === "resolved" && resolution.version.version).toBe(3);
    // Deleting the latest leaves the next one, which is the same rule applied to what remains.
    expect(nextVersionAfterDeletion(versions, 3)).toEqual({ status: "version", version: 2 });
    expect(nextVersionAfterDeletion([version(1)], 1)).toEqual({ status: "list" });
  });
});

test.describe("Dataset inventory scopes", () => {
  test("an organisation the caller belongs to answers for every unit under it", () => {
    expect(datasetInventoryScopes([groups()[0]])).toEqual([
      { kind: "organisation", organisationId },
    ]);
  });

  test("a member unit under an organisation the caller is outside is asked about directly", () => {
    expect(datasetInventoryScopes([groups()[1]])).toEqual([{ kind: "unit", unitId: otherUnitId }]);
  });

  test("units the caller is not a member of are never asked about", () => {
    expect(datasetInventoryScopes(groups())).toEqual([
      { kind: "organisation", organisationId },
      { kind: "unit", unitId: otherUnitId },
    ]);
    expect(datasetInventoryScopes([])).toEqual([]);
  });
});

test.describe("Dataset billing ancestry", () => {
  test("the unit the inventory reports the dataset against is the dataset's own unit", () => {
    expect(
      datasetBillingAncestry(
        [inventory([{ id: datasetId, unit_id: unitId, version: 2 }])],
        datasetId,
      ),
    ).toEqual({ kind: "named", unitId });
  });

  test("a dataset the caller only edits is reported the same way as one it owns", () => {
    expect(
      datasetBillingAncestry(
        [inventory([{ id: datasetId, unit_id: unitId, version: 1 }], "editor")],
        datasetId,
      ),
    ).toEqual({ kind: "named", unitId });
  });

  test("an inventory that names no such dataset establishes no ancestry", () => {
    expect(
      datasetBillingAncestry(
        [
          inventory([
            { id: "dataset-99999999-9999-4999-8999-999999999999", unit_id: unitId, version: 1 },
          ]),
        ],
        datasetId,
      ),
    ).toEqual({ kind: "unnamed" });
    expect(datasetBillingAncestry([], datasetId)).toEqual({ kind: "unnamed" });
  });

  test("every version of one dataset agreeing on a unit is still one answer", () => {
    expect(
      datasetBillingAncestry(
        [
          inventory([
            { id: datasetId, unit_id: unitId, version: 1 },
            { id: datasetId, unit_id: unitId, version: 2 },
          ]),
        ],
        datasetId,
      ),
    ).toEqual({ kind: "named", unitId });
  });

  test("reports that disagree about the unit are a conflict rather than a guess", () => {
    expect(
      datasetBillingAncestry(
        [
          inventory([{ id: datasetId, unit_id: unitId, version: 1 }]),
          inventory([{ id: datasetId, unit_id: otherUnitId, version: 2 }]),
        ],
        datasetId,
      ),
    ).toEqual({ kind: "conflicting" });
  });
});

test.describe("Inherited billing unit", () => {
  test("a named unit is presented with the ancestry the generated index gave it", () => {
    const inherited = resolveInheritedBillingUnit({
      ancestry: { kind: "named", unitId },
      freshness: "current",
      groups: groups(),
    });
    expect(inherited.kind).toBe("resolved");
    expect(inherited.kind === "resolved" && inherited.unitId).toBe(unitId);
    expect(inherited.kind === "resolved" && inherited.label).toBe("Unit 5555 — Organisation 2222");
  });

  test("a unit the caller's index does not name keeps its own identity", () => {
    const inherited = resolveInheritedBillingUnit({
      ancestry: { kind: "named", unitId: "unit-dddddddd-dddd-4ddd-8ddd-dddddddddddd" },
      freshness: "current",
      groups: groups(),
    });
    expect(inherited).toEqual({
      kind: "resolved",
      label: "unit-dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      unitId: "unit-dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    });
  });

  test("a read still arriving is pending rather than an absence of ancestry", () => {
    expect(
      resolveInheritedBillingUnit({
        ancestry: { kind: "unnamed" },
        freshness: "stale",
        groups: groups(),
      }),
    ).toEqual({ kind: "pending" });
  });

  test("an answered inventory that names no unit refuses the upload with a reason", () => {
    const inherited = resolveInheritedBillingUnit({
      ancestry: { kind: "unnamed" },
      freshness: "current",
      groups: groups(),
    });
    expect(inherited.kind).toBe("unresolved");
    expect(inherited.kind === "unresolved" && inherited.reason).toContain(
      "billing unit could not be established",
    );
  });

  test("an inventory that could not be read asks for a reload rather than promising an answer", () => {
    // A read still arriving will answer on its own; one that failed will not, so the two cannot
    // share a reason without one of them promising something that never comes.
    const inherited = resolveInheritedBillingUnit({
      ancestry: { kind: "unnamed" },
      freshness: "unavailable",
      groups: groups(),
    });
    expect(inherited.kind).toBe("unresolved");
    expect(inherited.kind === "unresolved" && inherited.reason).toContain("could not be read");
    expect(inherited.kind === "unresolved" && inherited.reason).toContain("Reload");
  });

  test("reads together are stale while any is coming, unreadable only once none is", () => {
    const answered = { answered: true, failed: false };
    const arriving = { answered: false, failed: false };
    const failed = { answered: false, failed: true };
    expect(datasetBillingFreshness([answered, answered])).toBe("current");
    expect(datasetBillingFreshness([])).toBe("current");
    expect(datasetBillingFreshness([answered, arriving])).toBe("stale");
    // A read that failed beside one still coming could still be answered by the one still coming.
    expect(datasetBillingFreshness([failed, arriving])).toBe("stale");
    expect(datasetBillingFreshness([answered, failed])).toBe("unavailable");
  });

  test("a conflict is refused whether or not every read has answered", () => {
    for (const freshness of ["current", "stale", "unavailable"] as const) {
      const inherited = resolveInheritedBillingUnit({
        ancestry: { kind: "conflicting" },
        freshness,
        groups: groups(),
      });
      expect(inherited.kind).toBe("unresolved");
      expect(inherited.kind === "unresolved" && inherited.reason).toContain("more than one unit");
    }
  });

  test("a named unit resolves even while another scope is still being read", () => {
    expect(
      resolveInheritedBillingUnit({
        ancestry: { kind: "named", unitId },
        freshness: "stale",
        groups: groups(),
      }).kind,
    ).toBe("resolved");
  });
});

test.describe("Version upload capability", () => {
  const resolved = { kind: "resolved", label: "Unit", unitId } as const;
  /** Version 2 is owned by the caller; version 1 is somebody else's. */
  const owned = version(2, { owner: "acceptance" });
  const foreign = version(1, { owner: "colleague" });
  const facts = (parent: DatasetVersionSummary, editors: string[] = []) => ({
    caller: { username: "acceptance" },
    dataset: { ...dataset([owned, foreign]), editors },
    freshness: "current" as const,
    version: parent,
  });

  test("an established billing unit and authority over the parent enable the upload", () => {
    expect(evaluateDatasetVersionUploadCapability({ ...facts(owned), billing: resolved })).toEqual({
      status: "enabled",
    });
  });

  test("authority is judged on the version being succeeded, not one merely on screen", () => {
    // The upload always succeeds the latest version, so a caller who owns that version may make
    // another whatever version they happen to be looking at, and one who owns only an older
    // version may not.
    expect(
      evaluateDatasetVersionUploadCapability({ ...facts(owned), billing: resolved }).status,
    ).toBe("enabled");
    expect(
      evaluateDatasetVersionUploadCapability({ ...facts(foreign), billing: resolved }),
    ).toEqual({ reason: "You must be an owner or editor of this dataset.", status: "disabled" });
  });

  test("authority is answered before billing is even considered", () => {
    expect(
      evaluateDatasetVersionUploadCapability({ ...facts(foreign), billing: { kind: "pending" } }),
    ).toEqual({ reason: "You must be an owner or editor of this dataset.", status: "disabled" });
  });

  test("unestablished ancestry disables the upload with its own concise reason", () => {
    expect(
      evaluateDatasetVersionUploadCapability({
        ...facts(owned),
        billing: {
          kind: "unresolved",
          reason: "This dataset is reported against more than one unit.",
        },
      }),
    ).toEqual({
      reason: "This dataset is reported against more than one unit.",
      status: "disabled",
    });
  });

  test("ancestry still being read is stated as itself rather than as an absence", () => {
    const capability = evaluateDatasetVersionUploadCapability({
      ...facts(owned),
      billing: { kind: "pending" },
    });
    expect(capability.status).toBe("disabled");
    expect(capability.status === "disabled" && capability.reason).toContain(
      "still being established",
    );
  });

  test("an unconfirmed permission still lets the caller try, as every other action does", () => {
    expect(
      evaluateDatasetVersionUploadCapability({
        ...facts(foreign),
        billing: resolved,
        freshness: "stale",
      }),
    ).toEqual({
      reason: "Your permission will be confirmed when you use this action.",
      status: "enabled",
    });
  });

  test("an editor of the dataset may succeed a version it does not own", () => {
    expect(
      evaluateDatasetVersionUploadCapability({
        ...facts(foreign, ["acceptance"]),
        billing: resolved,
      }),
    ).toEqual({ status: "enabled" });
  });
});

test.describe("Version upload input", () => {
  test("the new version keeps the latest version's filename and type", () => {
    const parent = version(2, { file_name: "renamed-v2.sdf", type: "text/csv" });
    expect(
      versionUploadInput({
        datasetId,
        file: new File(["acceptance"], "dropped.sdf"),
        formatExtraVariables: undefined,
        parent,
        unitId,
      }),
    ).toEqual({
      datasetId,
      file: expect.any(File),
      formatExtraVariables: undefined,
      mimeType: "text/csv",
      name: "renamed-v2.sdf",
      unitId,
    });
  });

  test("the parent's own type decides which entered extra variables travel with it", () => {
    const parent = version(2, { type: "chemical/x-mdl-sdfile" });
    expect(
      versionUploadInput({
        datasetId,
        file: new File(["acceptance"], "dropped.sdf"),
        formatExtraVariables: { "chemical/x-mdl-sdfile": { delimiter: "tab" } },
        parent,
        unitId,
      }).formatExtraVariables,
    ).toBe(JSON.stringify({ delimiter: "tab" }));
    expect(
      versionUploadInput({
        datasetId,
        file: new File(["acceptance"], "dropped.sdf"),
        formatExtraVariables: { "text/csv": { delimiter: "tab" } },
        parent,
        unitId,
      }).formatExtraVariables,
    ).toBeUndefined();
  });
});
