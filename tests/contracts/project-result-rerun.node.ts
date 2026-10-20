import { type InstanceGetResponse, type RunningWorkflowSummary } from "@/api/data-manager";
import { getGetInstancesQueryKey } from "@/api/data-manager/instance";
import { getGetRunningWorkflowsQueryKey } from "@/api/data-manager/workflow";

import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { resultListRequests } from "../../src/projects/resultFacts";
import { resolveRerunTarget, resolveWorkflowRerunTarget } from "../../src/projects/resultRerun";
import { parseProjectRoute, projectLinks } from "../../src/projects/routes";
import { runCatalogueRequests } from "../../src/projects/runFacts";

const projectId = "project-33333333-3333-4333-8333-333333333333";
const otherProjectId = "project-99999999-9999-4999-8999-999999999999";
const instanceId = "instance-55555555-5555-4555-8555-555555555555";
const taskId = "task-77777777-7777-4777-8777-777777777777";
const runningWorkflowId = "r-workflow-88888888-8888-4888-8888-888888888888";
const workflowId = "workflow-66666666-6666-4666-8666-666666666666";

const instance = (overrides: Partial<InstanceGetResponse> = {}) =>
  ({
    application_id: "acceptance-application",
    application_type: "JOB",
    application_version: "1.0.0",
    archived: false,
    job_id: 1,
    job_name: "Acceptance Job",
    launched: "2026-01-02T03:04:05Z",
    name: "Acceptance Instance",
    phase: "COMPLETED",
    project_id: projectId,
    started: "2026-01-02T03:04:05Z",
    ...overrides,
  }) as InstanceGetResponse;

const target = (overrides: Partial<InstanceGetResponse> = {}, routeProjectId = projectId) =>
  resolveRerunTarget({ instance: instance(overrides), instanceId, routeProjectId });

const runningWorkflow = (
  overrides: { projectId?: string; workflowId?: string } = {},
): Pick<RunningWorkflowSummary, "id" | "project" | "workflow"> => ({
  id: runningWorkflowId,
  project: { id: overrides.projectId ?? projectId, name: "Acceptance Project" },
  workflow: { id: overrides.workflowId ?? workflowId, name: "Acceptance Workflow", version: "1" },
});

const workflowTarget = (
  overrides: { projectId?: string; workflowId?: string } = {},
  routeProjectId = projectId,
) => resolveWorkflowRerunTarget({ routeProjectId, workflow: runningWorkflow(overrides) });

test.describe("Rerun route", () => {
  test("a rerun is a view of one instance, carrying only that instance's own list state", () => {
    // The rerun is addressed through the instance it reruns rather than a section of its own, so
    // leaving it lands back on the instance with the list state it was opened from.
    const href = projectLinks.resultRerun(projectId, "instances", instanceId, {
      search: "docking",
    });
    expect(href).toBe(
      `${projectLinks.result(projectId, "instances", instanceId, { search: "docking" })}&rerun=1`,
    );
    expect(parseProjectRoute(href)).toEqual({
      kind: "valid",
      route: {
        kind: "result",
        projectId,
        collection: "instances",
        resultId: instanceId,
        search: "docking",
        rerun: true,
      },
      canonicalHref: href,
      needsReplace: false,
    });
  });

  test("the instance's own route carries no rerun of its own", () => {
    // The instance and the instance with its rerun open are two routes rather than one, which is
    // what lets Back leave the rerun without leaving the instance.
    const canonicalHref = projectLinks.result(projectId, "instances", instanceId);
    expect(parseProjectRoute(canonicalHref)).toEqual({
      kind: "valid",
      route: { kind: "result", projectId, collection: "instances", resultId: instanceId },
      canonicalHref,
      needsReplace: false,
    });
  });

  test("a running workflow can be addressed with its rerun open", () => {
    // A running workflow names the workflow it ran, so it is run again through its own route just
    // as an instance is.
    const href = projectLinks.resultRerun(projectId, "workflows", runningWorkflowId);
    expect(href).toBe(`${projectLinks.result(projectId, "workflows", runningWorkflowId)}?rerun=1`);
    expect(parseProjectRoute(href)).toEqual({
      kind: "valid",
      route: {
        kind: "result",
        projectId,
        collection: "workflows",
        resultId: runningWorkflowId,
        rerun: true,
      },
      canonicalHref: href,
      needsReplace: false,
    });
  });

  test("a task cannot be addressed with a rerun open", () => {
    // A task names no definition to run again, so the flag is state its route does not own and is
    // removed rather than carried into anything it composes.
    const canonicalHref = projectLinks.result(projectId, "tasks", taskId);
    expect(parseProjectRoute(`${canonicalHref}?rerun=1`)).toEqual({
      kind: "valid",
      route: { kind: "result", projectId, collection: "tasks", resultId: taskId },
      canonicalHref,
      needsReplace: true,
    });
  });

  test("a rerun flag spelled any other way names nothing and is removed", () => {
    // One canonical spelling is what keeps a URL that opens the rerun distinguishable from one
    // that merely mentions it, so everything else is dropped like any other unowned state.
    const canonicalHref = projectLinks.result(projectId, "instances", instanceId);
    for (const query of ["rerun", "rerun=true", "rerun=0", "rerun=1&rerun=1"]) {
      expect(parseProjectRoute(`${canonicalHref}?${query}`)).toEqual({
        kind: "valid",
        route: { kind: "result", projectId, collection: "instances", resultId: instanceId },
        canonicalHref,
        needsReplace: true,
      });
    }
  });
});

test.describe("Rerun target", () => {
  test("an instance addressed beneath the project it declares names that one project", () => {
    // One project, named once: the project the capability was decided by, the project the launch
    // is sent for, and the project the created instance is opened in are the same value.
    expect(target()).toEqual({
      collection: "instances",
      jobId: 1,
      projectId,
      resultId: instanceId,
    });
  });

  test("an instance declaring another project offers no rerun at all", () => {
    // The pairing is one this client already refuses to display, so it may not compose a command
    // either — and nothing about it discloses the project that really owns the instance.
    expect(target({ project_id: otherProjectId })).toBeNull();
    expect(target({ project_id: projectId }, otherProjectId)).toBeNull();
  });

  test("an instance declaring no project of its own is placed by the URL", () => {
    // A read that declares no owner contradicts nothing, so the addressed project places it, the
    // same way every other part of the instance's own screen is placed.
    expect(target({ project_id: "" })).toEqual({
      collection: "instances",
      jobId: 1,
      projectId,
      resultId: instanceId,
    });
  });

  test("only an instance that ran an addressable job can be run again", () => {
    // An application has no job definition to reopen, and a job identity the Data Manager's own
    // format does not accept is not one this client may invent a request from.
    expect(target({ application_type: "APPLICATION", job_id: undefined })).toBeNull();
    expect(target({ job_id: undefined })).toBeNull();
    for (const jobId of [0, -1, 1.5, Number.NaN]) {
      expect(target({ job_id: jobId })).toBeNull();
    }
  });
});

test.describe("Workflow rerun target", () => {
  test("a running workflow addressed beneath the project it declares names that one project", () => {
    expect(workflowTarget()).toEqual({
      collection: "workflows",
      projectId,
      resultId: runningWorkflowId,
      workflowId,
    });
  });

  test("a running workflow declaring another project offers no rerun at all", () => {
    expect(workflowTarget({ projectId: otherProjectId })).toBeNull();
    expect(workflowTarget({}, otherProjectId)).toBeNull();
  });

  test("a running workflow declaring no project of its own is placed by the URL", () => {
    expect(workflowTarget({ projectId: "" })).toEqual({
      collection: "workflows",
      projectId,
      resultId: runningWorkflowId,
      workflowId,
    });
  });

  test("only a running workflow naming an addressable workflow can be run again", () => {
    for (const unaddressable of ["", "not-a-workflow"]) {
      expect(workflowTarget({ workflowId: unaddressable })).toBeNull();
    }
  });
});

test.describe("Rerun composition ownership", () => {
  const root = path.join(process.cwd(), "src");
  const source = (file: string) => readFileSync(path.join(root, file), "utf8");

  test("an accepted rerun refreshes the very collection it returns to", () => {
    // A rerun is launched from Results and opens a Results route, so the collection the launch
    // invalidates has to be the collection Results reads. Both are built from the project's own
    // list request through the generated key factory, so they are one cache identity.
    expect(getGetInstancesQueryKey(runCatalogueRequests(projectId).instances)).toEqual(
      getGetInstancesQueryKey(resultListRequests(projectId).instances),
    );
    expect(
      getGetRunningWorkflowsQueryKey(runCatalogueRequests(projectId).runningWorkflows),
    ).toEqual(getGetRunningWorkflowsQueryKey(resultListRequests(projectId).workflows));
  });

  test("a rerun is sent through the one launch owner, keyed by the result it reruns", () => {
    const rerun = source("projects/ProjectResultRerun.tsx");
    // The modal it composes is the one every launch goes through, so a rerun in flight and one an
    // authoritative refusal withheld are refused by the same attempt every other launch uses.
    expect(rerun).toContain("<JobModal");
    expect(rerun).toContain("<WorkflowModal");
    expect(rerun).toContain("`${target.projectId}-${target.collection}-${target.resultId}`");
    // Both halves of the command come from the one verified target, so no project reaches the
    // launch except the one the pairing was accepted for.
    expect(rerun).toContain("projectId: target.projectId");
    expect(rerun).not.toMatch(/routeProjectId|owningProjectId|instance\.project_id/u);
  });

  test("nothing offers or opens a rerun without a target that was resolved for it", () => {
    // The control, the card that places it, and the modal all read the one resolved target, so a
    // rerun cannot be offered for an instance that has none or addressed for a project it does not
    // name. Each is matched on the decision rather than its punctuation, so reformatting the JSX
    // around it cannot fail this.
    const button = source("components/results/RerunButton.tsx");
    // The link is composed from the target alone: no other project or result reaches it.
    expect(button).toMatch(
      /projectLinks\.resultRerun\(\s*target\.projectId,\s*target\.collection,\s*target\.resultId/u,
    );
    expect(button).not.toMatch(/instance\.project_id|routeProjectId|owningProjectId/u);
    // A card with no target offers no control, rather than offering one that composes nothing.
    for (const card of [
      "components/instances/InstanceResultCard.tsx",
      "components/workflows/WorkflowResultCard.tsx",
    ]) {
      expect(source(card)).toMatch(/rerunTarget === null\s*\?\s*null/u);
    }
    // A route asking for a rerun opens one only where the result beneath it offers one.
    const detail = source("projects/ProjectResultDetail.tsx");
    for (const collection of ["instances", "workflows"]) {
      expect(detail).toMatch(
        new RegExp(
          String.raw`route\.rerun === true\s*&&\s*rerunTarget\?\.collection === "${collection}"`,
          "u",
        ),
      );
    }
  });

  test("an answered rerun leaves no route behind that would offer it again", () => {
    // The rerun's own route is spent once the Data Manager has answered it. Adding the created
    // result instead of replacing it would leave a sendable rerun of work that has just been run
    // one Back away, so success replaces exactly as Close does.
    const detail = source("projects/ProjectResultDetail.tsx");
    expect(detail).not.toMatch(/router\.push/u);
    expect(detail).toMatch(
      /handleLaunched: \(target: RerunTarget[^)]*\) =>\s*void router\.replace/u,
    );
  });
});
