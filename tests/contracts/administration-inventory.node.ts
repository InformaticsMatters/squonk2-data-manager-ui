import { type UnitAllDetail } from "@/api/account-server";
import { type InventoryUserDetail, type InventoryUserGetResponse } from "@/api/data-manager";

import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  classifyInventoryRead,
  mapInventoryRead,
  organisationInventoryRows,
  pivotInventoryByProject,
  unitInventoryRows,
} from "../../src/administration/inventoryFacts";

const unitId = "unit-00000000-0000-4000-8000-000000000002";
const otherUnitId = "unit-00000000-0000-4000-8000-000000000003";
const unnamedUnitId = "unit-00000000-0000-4000-8000-000000000004";
const projectId = "project-00000000-0000-4000-8000-000000000005";
const otherProjectId = "project-00000000-0000-4000-8000-000000000006";

const owner = "owner@example.org";
const member = "member@example.org";
const stranger = "stranger@example.org";

const activity = {
  period_a: { activity: "42", active_days: 3, inactive_days: 4, monitoring_period: "7" },
  period_b: { activity: "30", active_days: 9, inactive_days: 21, monitoring_period: "30" },
  total_activity: "50",
  total_days_active: 10,
  total_days_inactive: 10,
  total_days_since_first_seen: 20,
};

const project = (id: string, name: string, unit: string) => ({ id, name, unit_id: unit });

/** A read the addressed resource answered with, in the shape the runtime classifier reads. */
const refused = (status: number) => ({ isAxiosError: true, response: { status } });

const inventoryUser = ({
  administrator = [] as ReturnType<typeof project>[],
  datasets = {},
  editor = [] as ReturnType<typeof project>[],
  observer = [] as ReturnType<typeof project>[],
  username,
}: {
  administrator?: ReturnType<typeof project>[];
  datasets?: InventoryUserDetail["datasets"];
  editor?: ReturnType<typeof project>[];
  observer?: ReturnType<typeof project>[];
  username: string;
}): InventoryUserDetail => ({
  activity,
  datasets,
  f_uid: 1,
  first_seen: "2026-01-02T03:04:05Z",
  last_seen_date: "2026-08-01",
  projects: { administrator, editor, observer },
  username,
});

const inventory = (users: InventoryUserDetail[]): InventoryUserGetResponse => ({
  today: "2026-08-09",
  users,
});

const unitResource = ({
  id = unitId,
  name = "Acceptance Unit",
  ownerId = owner,
  users = [member],
}: {
  id?: string;
  name?: string;
  ownerId?: string;
  users?: string[];
}): UnitAllDetail => ({
  billing_day: 1,
  caller_is_member: true,
  created: "2026-01-02T03:04:05Z",
  default_product_privacy: "DEFAULT_PRIVATE",
  id,
  name,
  owner_id: ownerId,
  private: true,
  users: users.map((user) => ({ id: user })),
});

test.describe("organisation report rows", () => {
  test("a user's units are counted from the projects the inventory named", () => {
    const rows = organisationInventoryRows({
      inventory: inventory([
        inventoryUser({
          administrator: [project(projectId, "Acceptance Project", unitId)],
          editor: [project(otherProjectId, "Screening Project", unitId)],
          username: member,
        }),
      ]),
      units: [unitResource({ users: [] })],
    });

    expect(rows).toEqual([
      expect.objectContaining({
        units: [{ id: unitId, name: "Acceptance Unit", projectCount: 2 }],
        username: member,
      }),
    ]);
  });

  test("observed projects are not projects a user can change", () => {
    const rows = organisationInventoryRows({
      inventory: inventory([
        inventoryUser({
          observer: [project(projectId, "Acceptance Project", unitId)],
          username: member,
        }),
      ]),
      units: [unitResource({ users: [member] })],
    });

    expect(rows[0].units).toEqual([{ id: unitId, name: "Acceptance Unit", projectCount: 0 }]);
  });

  test("a unit the user belongs to is named even when it holds no project of theirs", () => {
    const rows = organisationInventoryRows({
      inventory: inventory([
        inventoryUser({
          editor: [project(projectId, "Acceptance Project", unitId)],
          username: owner,
        }),
      ]),
      units: [
        unitResource({ users: [] }),
        unitResource({ id: otherUnitId, name: "Screening Unit", ownerId: owner, users: [] }),
      ],
    });

    expect(rows[0].units).toEqual([
      { id: unitId, name: "Acceptance Unit", projectCount: 1 },
      { id: otherUnitId, name: "Screening Unit", projectCount: 0 },
    ]);
  });

  test("a unit the caller's index does not name keeps its identity without a name", () => {
    const rows = organisationInventoryRows({
      inventory: inventory([
        inventoryUser({
          administrator: [project(projectId, "Acceptance Project", unnamedUnitId)],
          username: member,
        }),
      ]),
      units: [unitResource({ users: [] })],
    });

    expect(rows[0].units).toEqual([{ id: unnamedUnitId, name: undefined, projectCount: 1 }]);
  });

  test("a user connected to no unit of this organisation is not reported by it", () => {
    const rows = organisationInventoryRows({
      inventory: inventory([inventoryUser({ username: stranger })]),
      units: [unitResource({ users: [member] })],
    });

    expect(rows).toEqual([]);
  });

  test("usage facts are carried through unchanged", () => {
    const rows = organisationInventoryRows({
      inventory: inventory([
        inventoryUser({
          administrator: [project(projectId, "Acceptance Project", unitId)],
          datasets: {
            editor: [],
            owner: [{ filename: "a.sdf", id: "d", unit_id: unitId, version: 1 }],
          },
          username: member,
        }),
      ]),
      units: [unitResource({ users: [] })],
    });

    expect(rows[0]).toMatchObject({
      activity,
      datasets: { editor: 0, owner: 1 },
      firstSeen: "2026-01-02T03:04:05Z",
      lastSeen: "2026-08-01",
      username: member,
    });
  });
});

test.describe("unit report rows", () => {
  test("members and the owner are reported before they have done any work", () => {
    const rows = unitInventoryRows({
      inventory: inventory([
        inventoryUser({ username: member }),
        inventoryUser({ username: owner }),
        inventoryUser({ username: stranger }),
      ]),
      unit: unitResource({}),
    });

    expect(rows.map((row) => ({ isMember: row.isMember, username: row.username }))).toEqual([
      { isMember: true, username: member },
      { isMember: true, username: owner },
    ]);
  });

  test("a project role in this unit reports a user who is not a member of it", () => {
    const rows = unitInventoryRows({
      inventory: inventory([
        inventoryUser({
          observer: [project(projectId, "Acceptance Project", unitId)],
          username: stranger,
        }),
      ]),
      unit: unitResource({ users: [] }),
    });

    expect(rows).toEqual([expect.objectContaining({ isMember: false, username: stranger })]);
  });
});

test.describe("project pivot", () => {
  test("every role a project has is gathered under that project", () => {
    const projects = pivotInventoryByProject([
      inventoryUser({
        administrator: [project(projectId, "Acceptance Project", unitId)],
        username: owner,
      }),
      inventoryUser({
        editor: [project(projectId, "Acceptance Project", unitId)],
        observer: [project(otherProjectId, "Screening Project", otherUnitId)],
        username: member,
      }),
      inventoryUser({
        observer: [project(projectId, "Acceptance Project", unitId)],
        username: stranger,
      }),
    ]);

    expect(projects).toEqual([
      {
        administrators: [owner],
        editors: [member],
        name: "Acceptance Project",
        observers: [stranger],
        projectId,
      },
      {
        administrators: [],
        editors: [],
        name: "Screening Project",
        observers: [member],
        projectId: otherProjectId,
      },
    ]);
  });

  test("a project nobody holds a role in is not invented", () => {
    expect(pivotInventoryByProject([inventoryUser({ username: member })])).toEqual([]);
  });
});

test.describe("report reads", () => {
  const report = inventory([]);

  test("a read that has not answered has established nothing", () => {
    expect(classifyInventoryRead({ data: undefined, error: null, isError: false })).toEqual({
      kind: "pending",
    });
  });

  test("an answered read is available", () => {
    expect(classifyInventoryRead({ data: report, error: null, isError: false })).toEqual({
      kind: "available",
      report,
    });
  });

  test("a confirmed refusal or absence replaces what was read", () => {
    for (const status of [403, 404]) {
      expect(
        classifyInventoryRead({ data: report, error: refused(status), isError: true }),
      ).toMatchObject({ kind: "unavailable" });
      expect(
        classifyInventoryRead({ data: undefined, error: refused(status), isError: true }),
      ).toMatchObject({ kind: "unavailable" });
    }
  });

  test("a report that could not be refreshed stays readable and says so", () => {
    for (const status of [429, 500, 503]) {
      const read = classifyInventoryRead({ data: report, error: refused(status), isError: true });
      expect(read).toMatchObject({ kind: "stale", report });
    }
  });

  test("a transient failure that established nothing has nothing to keep", () => {
    expect(
      classifyInventoryRead({ data: undefined, error: refused(503), isError: true }),
    ).toMatchObject({ kind: "unavailable" });
  });

  test("shaping a report keeps the read it was answered with", () => {
    expect(
      mapInventoryRead(
        classifyInventoryRead({ data: report, error: null, isError: false }),
        () => 1,
      ),
    ).toEqual({ kind: "available", report: 1 });
    expect(
      mapInventoryRead(
        classifyInventoryRead({ data: report, error: refused(503), isError: true }),
        () => 1,
      ),
    ).toMatchObject({ kind: "stale", report: 1 });
    expect(
      mapInventoryRead(
        classifyInventoryRead({ data: undefined, error: null, isError: false }),
        () => 1,
      ),
    ).toEqual({ kind: "pending" });
  });
});

test.describe("report ownership", () => {
  const root = path.join(process.cwd(), "src");
  const typescriptSource = /\.tsx?$/u;
  const generated = /(^|\/)generated\//u;

  const handwrittenSources = () =>
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
      .map((entry) =>
        path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
      )
      .filter((file) => !generated.test(file) && !file.startsWith("api/"))
      .toSorted();

  test("the legacy inventory pages and their feature modules no longer exist", () => {
    // The legacy global unit and organisation inventory routes are ordinary not-found now, so no
    // page, feature, or component of theirs survives the cutover.
    const removed = handwrittenSources().filter(
      (file) =>
        file.startsWith("components/usage/") ||
        file.startsWith("features/usage/") ||
        file.startsWith("pages/organisation/") ||
        file.startsWith("pages/unit/"),
    );
    expect(removed).toEqual([]);
  });

  test("the report changes nothing it reports, and copies nothing it does not own", () => {
    const source = readFileSync(path.join(root, "administration/UsageInventory.tsx"), "utf8");
    expect(source).not.toMatch(/useQueryClient|invalidateQueries|useMutation/u);
    // Project roles are reported here and changed on that project's own Manage route, which the
    // report reaches through that destination's route interface alone.
    expect(source).toContain("projectLinks.manage");
    expect(source).not.toContain("CreateProjectForm");
    // A unit's owner, members and privacy are one tab away in its own Access section, so the
    // report shows no read-only copy of them beside a link to the copy that can be changed. The
    // cross-task pointer machinery that used to carry those copies is gone with them.
    expect(source).not.toMatch(/ReadOnlyNotice|organisationAccessOwner|MutationOwner/u);
  });

  const sourcesContaining = (needle: string) =>
    handwrittenSources().filter((file) =>
      readFileSync(path.join(root, file), "utf8").includes(needle),
    );

  test("only the report's own module reads the generated inventory endpoint", () => {
    expect(sourcesContaining("useGetUserInventory")).toEqual([
      "administration/useUsageInventory.ts",
    ]);
  });

  test("the inventory cache identity is only ever the generated key factory", () => {
    // The report reads the endpoint through its generated query alone, so nothing in the tree
    // builds a cache identity of its own for it — not even to refresh it after a change.
    expect(sourcesContaining("getGetUserInventoryQueryKey")).toEqual([]);
  });
});
