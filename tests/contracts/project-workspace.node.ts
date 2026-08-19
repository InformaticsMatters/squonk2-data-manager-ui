import { type ProductUnitGetResponse, type UnitsGetResponse } from "@/api/account-server";
import { getGetProductQueryKey } from "@/api/account-server/product";
import { type ProjectDetail } from "@/api/data-manager";
import { getGetProjectQueryKey, getGetProjectsQueryKey } from "@/api/data-manager/project";

import { expect, test } from "@playwright/test";
import { QueryClient } from "@tanstack/react-query";

import {
  dismissProjectOnboarding,
  PROJECT_ONBOARDING_DISMISSAL_KEY,
  projectOnboardingIsDismissed,
} from "../../src/projects/onboardingDismissal";
import { requireLinkedProject, resolveProjectAncestry } from "../../src/projects/projectAncestry";
import { removeUnavailableProject } from "../../src/projects/projectCache";
import { buildProjectIndexItems, decideProjectOnboarding } from "../../src/projects/projectIndex";
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

  expect(resolveProjectAncestry(requireLinkedProject(project()), response)).toEqual({
    organisation: response.product.organisation,
    product: response.product,
    unit: response.product.unit,
  });
  expect(() =>
    resolveProjectAncestry(
      requireLinkedProject(project({ organisation_id: "organisation-two" })),
      response,
    ),
  ).toThrow("does not match its linked product ancestry");
  expect(() => requireLinkedProject(project({ product_id: undefined }))).toThrow(
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

test("confirmed project loss removes only generated ancestry cache identities", () => {
  // The caller's index survives, because it is a list of what they can still reach rather than
  // content of the project they lost; it is only marked for a fresh read.
  const queryClient = new QueryClient();
  const storageValues = new Map<string, string>();
  const storage = {
    getItem: (key: string) => storageValues.get(key) ?? null,
    setItem: (key: string, value: string) => storageValues.set(key, value),
  };
  const linkedProject = requireLinkedProject(project({ project_id: "project-two" }));
  const projectKey = getGetProjectQueryKey(linkedProject.project_id);
  const productKey = getGetProductQueryKey(linkedProject.product_id);
  const unrelatedKey = ["unrelated", { projectId: linkedProject.project_id }] as const;
  const indexKey = getGetProjectsQueryKey();
  queryClient.setQueryData(projectKey, linkedProject);
  queryClient.setQueryData(productKey, { product: {} });
  queryClient.setQueryData(unrelatedKey, "retain me");
  queryClient.setQueryData(indexKey, [linkedProject]);
  recordRecentProject(storage, linkedProject.project_id);

  removeUnavailableProject(queryClient, storage, linkedProject.project_id);

  expect(queryClient.getQueryData(projectKey)).toBeUndefined();
  expect(queryClient.getQueryData(productKey)).toBeUndefined();
  expect(queryClient.getQueryData(unrelatedKey)).toBe("retain me");
  expect(queryClient.getQueryData(indexKey)).toEqual([linkedProject]);
  expect(queryClient.getQueryState(indexKey)?.isInvalidated).toBe(true);
  expect(readRecentProjectIds(storage)).toEqual([]);
});

test.describe("project onboarding offer", () => {
  const personalUnitId = "unit-personal";
  const caller = "user-one";
  /** A project in someone else's unit that the caller neither created nor holds a role in. */
  const other = (overrides: Partial<ProjectDetail> = {}) =>
    project({ creator: "someone-else", unit_id: "unit-one", ...overrides });

  const cases: {
    dismissible: boolean;
    name: string;
    offered: boolean;
    personalUnit?: string;
    projects: ProjectDetail[];
    step: boolean;
    username?: string;
  }[] = [
    {
      dismissible: false,
      name: "no personal unit and no projects offers onboarding from its first step",
      offered: true,
      projects: [],
      step: true,
    },
    {
      dismissible: false,
      name: "a personal unit with no projects skips the step it already satisfies",
      offered: true,
      personalUnit: personalUnitId,
      projects: [],
      step: false,
    },
    {
      dismissible: false,
      name: "a project of the caller's own in their personal unit ends the offer",
      offered: false,
      personalUnit: personalUnitId,
      projects: [other({ administrators: [caller], unit_id: personalUnitId })],
      step: false,
    },
    {
      dismissible: true,
      name: "an editor in someone else's unit is still offered a unit of their own",
      offered: true,
      projects: [other({ editors: [caller] })],
      step: true,
    },
    {
      dismissible: true,
      name: "an administrator in someone else's unit is offered the same",
      offered: true,
      projects: [other({ administrators: [caller] })],
      step: true,
    },
    {
      dismissible: false,
      name: "an observer cannot dismiss the only route to a project they can work in",
      offered: true,
      projects: [other({ observers: [caller] })],
      step: true,
    },
    {
      dismissible: true,
      name: "a personal unit holding no project keeps the offer without its first step",
      offered: true,
      personalUnit: personalUnitId,
      projects: [other({ editors: [caller] })],
      step: false,
    },
    {
      dismissible: false,
      name: "creating a project is not the same as being able to write to it",
      offered: true,
      projects: [other({ creator: caller })],
      step: true,
    },
    {
      dismissible: false,
      name: "an unresolved caller can write to no project at all",
      offered: true,
      projects: [other({ administrators: [caller], editors: [caller] })],
      step: true,
      username: undefined,
    },
  ];

  for (const testCase of cases) {
    test(testCase.name, () => {
      const username = "username" in testCase ? testCase.username : caller;
      expect(decideProjectOnboarding(testCase.projects, username, testCase.personalUnit)).toEqual({
        dismissible: testCase.dismissible,
        offered: testCase.offered,
        personalUnitStepApplies: testCase.step,
      });
    });
  }

  test("a platform administrator is answered by their project roles like any other caller", () => {
    // The decision takes no platform-privilege input at all, which is the guarantee: an
    // administrator of the application holds authority over it, never a role in a project. So the
    // answer for a privileged caller who is not a member is the same answer any other non-member
    // gets over the very same projects, rather than a shorter route into one they do not belong to.
    const projects = [
      other({ administrators: ["someone-else"], editors: ["someone-else"] }),
      other({ unit_id: personalUnitId }),
    ];

    expect(decideProjectOnboarding(projects, "platform-administrator", personalUnitId)).toEqual(
      decideProjectOnboarding(projects, "ordinary-outsider", personalUnitId),
    );
    expect(decideProjectOnboarding(projects, "platform-administrator", personalUnitId)).toEqual({
      dismissible: false,
      offered: true,
      personalUnitStepApplies: false,
    });
  });
});

test("the onboarding dismissal is remembered under its own account-scoped key", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  expect(projectOnboardingIsDismissed(storage)).toBe(false);
  dismissProjectOnboarding(storage);

  expect(projectOnboardingIsDismissed(storage)).toBe(true);
  expect([...values.keys()]).toEqual([PROJECT_ONBOARDING_DISMISSAL_KEY]);
});
