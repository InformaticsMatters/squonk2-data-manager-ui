import { expect, test } from "@playwright/test";

import { parseProjectRoute, projectLinks } from "../../src/projects/routes";

const projectId = "project-00000000-0000-4000-8000-000000000001";
const productId = "product-00000000-0000-4000-8000-000000000002";
const taskId = "task-00000000-0000-4000-8000-000000000003";
const instanceId = "instance-00000000-0000-4000-8000-000000000004";
const workflowId = "workflow-00000000-0000-4000-8000-000000000005";
const runningWorkflowId = "r-workflow-00000000-0000-4000-8000-000000000006";
const unitId = "unit-00000000-0000-4000-8000-000000000007";

test.describe("Project route contract", () => {
  const canonicalHrefs = [
    ["/projects", () => projectLinks.index()],
    ["/projects?search=screening", () => projectLinks.index({ search: "screening" })],
    ["/projects/new", () => projectLinks.create()],
    [
      `/projects/new?subscription=${productId}`,
      () => projectLinks.create({ subscriptionId: productId }),
    ],
    [`/projects/new?unit=${unitId}`, () => projectLinks.create({ unitId })],
    [
      `/projects/new?subscription=${productId}&unit=${unitId}`,
      () => projectLinks.create({ subscriptionId: productId, unitId }),
    ],
    [
      `/projects/deletions/${taskId}?subscription=${productId}`,
      () => projectLinks.deletion(taskId, { subscriptionId: productId }),
    ],
    [`/projects/${projectId}/files`, () => projectLinks.files(projectId)],
    [
      `/projects/${projectId}/files?path=%2Finputs`,
      () => projectLinks.files(projectId, { path: "/inputs" }),
    ],
    [
      `/projects/${projectId}/files/view?path=%2Finputs%2Flibrary.sdf&viewer=sdf`,
      () => projectLinks.fileView(projectId, { path: "/inputs/library.sdf", viewer: "sdf" }),
    ],
    [
      `/projects/${projectId}/run?search=docking&type=workflow&type=job`,
      () => projectLinks.run(projectId, { search: "docking", types: ["workflow", "job"] }),
    ],
    [
      `/projects/${projectId}/run/jobs/42?search=docking`,
      () => projectLinks.runDefinition(projectId, "jobs", "42", { search: "docking" }),
    ],
    [
      `/projects/${projectId}/run/applications/jupyter-lab`,
      () => projectLinks.runDefinition(projectId, "applications", "jupyter-lab"),
    ],
    [
      `/projects/${projectId}/run/workflows/${workflowId}`,
      () => projectLinks.runDefinition(projectId, "workflows", workflowId),
    ],
    [
      `/projects/${projectId}/results?search=completed&type=task&type=instance`,
      () => projectLinks.results(projectId, { search: "completed", types: ["task", "instance"] }),
    ],
    [
      `/projects/${projectId}/results/tasks/${taskId}`,
      () => projectLinks.result(projectId, "tasks", taskId),
    ],
    [
      `/projects/${projectId}/results/instances/${instanceId}`,
      () => projectLinks.result(projectId, "instances", instanceId),
    ],
    [
      `/projects/${projectId}/results/instances/${instanceId}?rerun=1`,
      () => projectLinks.resultRerun(projectId, instanceId),
    ],
    [
      `/projects/${projectId}/results/instances/${instanceId}?search=docking&type=instance&rerun=1`,
      () =>
        projectLinks.resultRerun(projectId, instanceId, { search: "docking", types: ["instance"] }),
    ],
    [
      `/projects/${projectId}/results/workflows/${runningWorkflowId}`,
      () => projectLinks.result(projectId, "workflows", runningWorkflowId),
    ],
    [`/projects/${projectId}/manage`, () => projectLinks.manage(projectId)],
  ] as const;

  for (const [href, buildHref] of canonicalHrefs) {
    test(`round trips ${href}`, () => {
      expect(buildHref()).toBe(href);
      expect(parseProjectRoute(href)).toMatchObject({
        kind: "valid",
        canonicalHref: href,
        needsReplace: false,
      });
    });

    test(`removes unknown query state from ${href}`, () => {
      const contaminatedHref = `${href}${href.includes("?") ? "&" : "?"}unknown=value`;
      expect(parseProjectRoute(contaminatedHref)).toMatchObject({
        kind: "valid",
        canonicalHref: href,
        needsReplace: true,
      });
    });
  }

  test("canonicalises project entry to Files", () => {
    expect(parseProjectRoute(projectLinks.entry(projectId))).toEqual({
      kind: "valid",
      route: { kind: "files", projectId },
      canonicalHref: projectLinks.files(projectId),
      needsReplace: true,
    });
  });

  test("builders canonicalise set-valued query state", () => {
    const href = projectLinks.run(projectId, { types: ["job", "workflow", "job"] });
    expect(href).toBe(`${projectLinks.run(projectId)}?type=workflow&type=job`);
    expect(parseProjectRoute(href)).toMatchObject({ needsReplace: false });
  });

  test("gives static creation and deletion routes precedence over project identity", () => {
    expect(parseProjectRoute("/projects/new")).toMatchObject({
      kind: "valid",
      route: { kind: "create" },
    });
    expect(parseProjectRoute(`/projects/deletions/${taskId}`)).toMatchObject({
      kind: "valid",
      route: { kind: "deletion", taskId },
    });
  });

  test("removes unknown and section-inappropriate query state", () => {
    expect(
      parseProjectRoute(
        `/projects/${projectId}/results?path=%2Fprivate&search=needle&unknown=value`,
      ),
    ).toEqual({
      kind: "valid",
      route: { kind: "results", projectId, search: "needle" },
      canonicalHref: projectLinks.results(projectId, { search: "needle" }),
      needsReplace: true,
    });
  });

  test("removes malformed optional state instead of using it", () => {
    expect(parseProjectRoute(`/projects/${projectId}/files?path=relative&path=%2Fother`)).toEqual({
      kind: "valid",
      route: { kind: "files", projectId },
      canonicalHref: projectLinks.files(projectId),
      needsReplace: true,
    });
    expect(
      parseProjectRoute(`/projects/${projectId}/files/view?path=%2Ffile.sdf&viewer=unknown`),
    ).toEqual({
      kind: "valid",
      route: { kind: "file-view", projectId, path: "/file.sdf" },
      canonicalHref: projectLinks.fileView(projectId, { path: "/file.sdf" }),
      needsReplace: true,
    });
  });

  test("treats malformed required identity and required state as not found", () => {
    for (const href of [
      "/projects/not-a-project/files",
      `//example.org/projects/${projectId}/files`,
    ]) {
      expect(parseProjectRoute(href), href).toEqual({ kind: "not-found" });
    }
  });

  const localNotFoundCases = [
    [`/projects/${projectId}/files/view`, "files"],
    [`/projects/${projectId}/files/view?path=relative`, "files"],
    [`/projects/${projectId}/run/jobs/not-a-number`, "run"],
    [`/projects/${projectId}/run/applications/Invalid`, "run"],
    [`/projects/${projectId}/run/workflows/not-a-workflow`, "run"],
    // A URL beneath Run that is not shaped like a definition route at all is answered by Run too,
    // so a mistyped path never costs the project frame it was addressed beneath.
    [`/projects/${projectId}/run/jobs`, "run"],
    [`/projects/${projectId}/run/jobs/42/versions`, "run"],
    [`/projects/${projectId}/run/jobs/42/versions/1`, "run"],
    [`/projects/${projectId}/results/tasks/not-a-task`, "results"],
    [`/projects/${projectId}/results/instances/not-an-instance`, "results"],
    [`/projects/${projectId}/results/workflows/not-a-running-workflow`, "results"],
  ] as const;

  for (const [href, section] of localNotFoundCases) {
    test(`retains the valid project for local not-found: ${href}`, () => {
      expect(parseProjectRoute(href)).toEqual({
        kind: "not-found",
        parent: { family: "projects", section, resourceId: projectId },
      });
    });
  }

  test("removes malformed optional identity and filter state", () => {
    expect(parseProjectRoute("/projects/new?subscription=not-a-product")).toEqual({
      kind: "valid",
      route: { kind: "create" },
      canonicalHref: projectLinks.create(),
      needsReplace: true,
    });
    // A link naming a unit this client cannot even read as one addresses creation with nothing
    // chosen, exactly as a bare creation link does.
    expect(parseProjectRoute("/projects/new?unit=not-a-unit")).toEqual({
      kind: "valid",
      route: { kind: "create" },
      canonicalHref: projectLinks.create(),
      needsReplace: true,
    });
    expect(parseProjectRoute(`/projects/${projectId}/run?type=job&type=unknown`)).toEqual({
      kind: "valid",
      route: { kind: "run", projectId },
      canonicalHref: projectLinks.run(projectId),
      needsReplace: true,
    });
  });

  test("builders reject malformed identity rather than producing a guessed link", () => {
    expect(() => projectLinks.files("not-a-project")).toThrow();
    expect(() => projectLinks.deletion("not-a-task")).toThrow();
    expect(() => projectLinks.create({ unitId: "not-a-unit" })).toThrow();
    expect(() => projectLinks.result(projectId, "instances", "not-an-instance")).toThrow();
  });
});
