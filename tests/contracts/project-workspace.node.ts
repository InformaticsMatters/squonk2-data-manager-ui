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
import {
  buildProjectIndexItems,
  buildProjectSelectorList,
  decideProjectOnboarding,
} from "../../src/projects/projectIndex";
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

test.describe("project selector list", () => {
  const ancestry = {
    organisations: [
      { id: "organisation-one", name: "Current Organisation" },
      { id: "organisation-two", name: "Partner Organisation" },
    ],
    units: {
      units: [
        ...units.units,
        {
          count: 1,
          organisation: { id: "organisation-two", name: "Partner Organisation" },
          units: [{ id: "unit-three", name: "Partnership" }],
        },
      ],
    } as UnitsGetResponse,
  };
  const reachable = [
    project({ name: "Alpha", project_id: "project-alpha", unit_id: "unit-one" }),
    project({ name: "Beta", project_id: "project-beta", unit_id: "unit-two" }),
    project({
      name: "Gamma",
      organisation_id: "organisation-two",
      project_id: "project-gamma",
      unit_id: "unit-three",
    }),
  ];

  const cases: {
    headings: string[];
    name: string;
    projects?: ProjectDetail[];
    recent?: string[];
    rows: string[][];
    search?: string;
    urlProject?: string;
  }[] = [
    {
      headings: ["All projects (3)"],
      name: "with nothing recent the whole list is one section ordered by project name",
      rows: [["Alpha", "Beta", "Gamma"]],
    },
    {
      headings: ["Recent (2)", "All projects (1)"],
      name: "recents are pinned in stored order and lifted out of the section below",
      recent: ["project-gamma", "project-alpha"],
      rows: [["Gamma", "Alpha"], ["Beta"]],
    },
    {
      headings: ["Recent (1)", "All projects (2)"],
      name: "the project the address bar names is left out of the recents but kept in the list",
      recent: ["project-beta", "project-alpha"],
      rows: [["Alpha"], ["Beta", "Gamma"]],
      urlProject: "project-beta",
    },
    {
      headings: ["Recent (1)", "All projects (2)"],
      name: "a recent naming a project the caller can no longer reach is dropped",
      recent: ["project-departed", "project-alpha"],
      rows: [["Alpha"], ["Beta", "Gamma"]],
    },
    {
      headings: ["1 of 3 projects"],
      name: "a search replaces the recents with one counted set of matches",
      recent: ["project-gamma"],
      rows: [["Beta"]],
      search: "beta",
    },
    {
      headings: ["1 of 3 projects"],
      name: "a search matches the containing unit",
      rows: [["Beta"]],
      search: "screening",
    },
    {
      headings: ["1 of 3 projects"],
      name: "a search matches the containing organisation",
      rows: [["Gamma"]],
      search: "partner",
    },
    {
      headings: ["2 of 3 projects"],
      name: "matching ignores case and surrounding space",
      rows: [["Alpha", "Beta"]],
      search: "  CURRENT ORGANISATION  ",
    },
    {
      headings: [],
      name: "a search matching nothing offers no section to scroll",
      rows: [],
      search: "no such project",
    },
    {
      headings: [],
      name: "a caller who can reach no project is offered no section either",
      projects: [],
      rows: [],
    },
  ];

  for (const testCase of cases) {
    test(testCase.name, () => {
      const list = buildProjectSelectorList(
        testCase.projects ?? reachable,
        ancestry,
        testCase.recent ?? [],
        testCase.urlProject,
        testCase.search,
      );

      expect(list.sections.map(({ heading }) => heading)).toEqual(testCase.headings);
      expect(list.sections.map(({ rows }) => rows.map(({ projectName }) => projectName))).toEqual(
        testCase.rows,
      );
      // One continuous list is what the keyboard walks, so the flat order is the sections' own and
      // each section knows where in it that section starts.
      expect(list.rows.map(({ projectName }) => projectName)).toEqual(testCase.rows.flat());
      expect(list.sections.map(({ startIndex }) => startIndex)).toEqual(
        testCase.rows.map((_, index) => testCase.rows.slice(0, index).flat().length),
      );
    });
  }

  test("only the project the address bar names is marked as the one being displayed", () => {
    const list = buildProjectSelectorList(reachable, ancestry, [], "project-beta");

    expect(list.rows.map(({ isUrlProject, projectId }) => [projectId, isUrlProject])).toEqual([
      ["project-alpha", false],
      ["project-beta", true],
      ["project-gamma", false],
    ]);
  });

  test("a row keeps its containing identity when the ancestry cannot name it", () => {
    const list = buildProjectSelectorList(
      [
        project({
          name: "Unlisted",
          organisation_id: "organisation-unlisted",
          project_id: "project-unlisted",
          unit_id: "unit-unlisted",
        }),
      ],
      ancestry,
      [],
      undefined,
    );

    expect(list.rows[0]).toEqual({
      isUrlProject: false,
      organisationName: "Organisation organisation-unlisted",
      projectId: "project-unlisted",
      projectName: "Unlisted",
      unitName: "Unit unit-unlisted",
    });
  });
});
