import { type ProductUnitGetResponse, type UnitsGetResponse } from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import { expect, test } from "@playwright/test";

import { resolveProjectAncestry } from "../../src/projects/projectAncestry";
import { buildProjectIndexItems } from "../../src/projects/projectIndex";
import {
  readRecentProjectIds,
  recordRecentProject,
  removeRecentProject,
} from "../../src/projects/recentProjects";

const project = (overrides: Partial<ProjectDetail> = {}): ProjectDetail => ({
  administrators: [],
  created: "2026-01-02T03:04:05Z",
  creator: "user-one",
  editors: [],
  name: "Shared Project",
  observers: [],
  organisation_id: "organisation-one",
  private: true,
  product_id: "product-one",
  project_id: "project-one",
  size: 0,
  unit_id: "unit-one",
  ...overrides,
});

const units = {
  units: [
    {
      count: 2,
      organisation: { id: "organisation-one", name: "Current Organisation" },
      units: [
        { id: "unit-one", name: "Discovery" },
        { id: "unit-two", name: "Screening" },
      ],
    },
  ],
} as UnitsGetResponse;

test("project index is organisation-scoped, searchable, and labels duplicate names by unit", () => {
  const items = buildProjectIndexItems(
    [
      project(),
      project({ project_id: "project-two", unit_id: "unit-two" }),
      project({ name: "Other", organisation_id: "organisation-two", project_id: "project-three" }),
    ],
    units,
    "organisation-one",
    "screen",
  );

  expect(items).toEqual([
    {
      organisationName: "Current Organisation",
      project: expect.objectContaining({ project_id: "project-two" }),
      unitName: "Screening",
    },
  ]);
});

test("project index retains containing-unit identity when its name is unavailable", () => {
  const items = buildProjectIndexItems(
    [project({ unit_id: "unit-not-listed" })],
    units,
    "organisation-one",
  );

  expect(items[0]?.unitName).toBe("Unit unit-not-listed");
});

test("project ancestry comes from the linked generated Product response", () => {
  const response = {
    product: {
      claim: { id: "project-one", name: "Shared Project" },
      organisation: { id: "organisation-one", name: "Current Organisation" },
      product: { id: "product-one" },
      unit: { id: "unit-one", name: "Discovery" },
    },
  } as ProductUnitGetResponse;

  expect(resolveProjectAncestry(project(), response)).toEqual({
    organisation: response.product.organisation,
    product: response.product,
    unit: response.product.unit,
  });
  expect(() =>
    resolveProjectAncestry(project({ organisation_id: "organisation-two" }), response),
  ).toThrow("does not match its linked product ancestry");
  expect(() => resolveProjectAncestry(project({ product_id: undefined }), response)).toThrow(
    "does not identify a linked product",
  );
});

test("confirmed project loss removes only that project from recents", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  recordRecentProject(storage, "project-one");
  recordRecentProject(storage, "project-two");

  removeRecentProject(storage, "project-two");

  expect(readRecentProjectIds(storage)).toEqual(["project-one"]);
});
