import { expect, test } from "@playwright/test";

import { parseProjectRoute, projectLinks } from "../../src/projects/routes";

const projectId = "project-00000000-0000-4000-8000-000000000001";
const productId = "product-00000000-0000-4000-8000-000000000002";
const taskId = "task-00000000-0000-4000-8000-000000000003";
const instanceId = "instance-00000000-0000-4000-8000-000000000004";
const workflowId = "workflow-00000000-0000-4000-8000-000000000005";
const runningWorkflowId = "r-workflow-00000000-0000-4000-8000-000000000006";

test.describe("Project route contract", () => {
  const canonicalHrefs = [
    projectLinks.index(),
    projectLinks.index({ search: "screening" }),
    projectLinks.create(),
    projectLinks.create({ subscriptionId: productId }),
    projectLinks.deletion(taskId, { subscriptionId: productId }),
    projectLinks.files(projectId),
    projectLinks.files(projectId, { path: "/inputs" }),
    projectLinks.fileView(projectId, { path: "/inputs/library.sdf", viewer: "sdf" }),
    projectLinks.run(projectId, { search: "docking", types: ["workflow", "job"] }),
    projectLinks.runDefinition(projectId, "jobs", "42", { search: "docking" }),
    projectLinks.runDefinition(projectId, "applications", "jupyter-lab"),
    projectLinks.runDefinition(projectId, "workflows", workflowId),
    projectLinks.results(projectId, { search: "completed", types: ["task", "instance"] }),
    projectLinks.result(projectId, "tasks", taskId),
    projectLinks.result(projectId, "instances", instanceId),
    projectLinks.result(projectId, "workflows", runningWorkflowId),
    projectLinks.manage(projectId),
  ];

  for (const href of canonicalHrefs) {
    test(`round trips ${href}`, () => {
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
    expect(() => projectLinks.result(projectId, "instances", "not-an-instance")).toThrow();
  });
});
