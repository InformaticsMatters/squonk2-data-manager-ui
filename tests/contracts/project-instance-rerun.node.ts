import { type InstanceGetResponse } from "@/api/data-manager";
import { getGetInstancesQueryKey } from "@/api/data-manager/instance";

import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { resultListRequests } from "../../src/projects/resultFacts";
import { resolveRerunTarget } from "../../src/projects/resultRerun";
import { parseProjectRoute, projectLinks } from "../../src/projects/routes";
import { runCatalogueRequests } from "../../src/projects/runFacts";

const projectId = "project-33333333-3333-4333-8333-333333333333";
const otherProjectId = "project-99999999-9999-4999-8999-999999999999";
const instanceId = "instance-55555555-5555-4555-8555-555555555555";
const taskId = "task-77777777-7777-4777-8777-777777777777";
const runningWorkflowId = "r-workflow-88888888-8888-4888-8888-888888888888";

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

test.describe("Rerun route", () => {
  test("a rerun is a view of one instance, carrying only that instance's own list state", () => {
    // The rerun is addressed through the instance it reruns rather than a section of its own, so
    // leaving it lands back on the instance with the list state it was opened from.
    const href = projectLinks.resultRerun(projectId, instanceId, { search: "docking" });
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

  test("only an instance can be addressed with a rerun open", () => {
    // A task and a running workflow name no job to run again, so the flag is state their routes do
    // not own and is removed rather than carried into anything they compose.
    for (const [collection, resultId] of [
      ["tasks", taskId],
      ["workflows", runningWorkflowId],
    ] as const) {
      const canonicalHref = projectLinks.result(projectId, collection, resultId);
      expect(parseProjectRoute(`${canonicalHref}?rerun=1`)).toEqual({
        kind: "valid",
        route: { kind: "result", projectId, collection, resultId },
        canonicalHref,
        needsReplace: true,
      });
    }
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
    expect(target()).toEqual({ instanceId, jobId: 1, projectId });
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
    expect(target({ project_id: "" })).toEqual({ instanceId, jobId: 1, projectId });
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
  });

  test("a rerun is sent through the one launch owner, keyed by the instance it reruns", () => {
    const rerun = source("projects/ProjectResultRerun.tsx");
    // The modal it composes is the one every launch goes through, so a rerun in flight and one an
    // authoritative refusal withheld are refused by the same attempt every other launch uses.
    expect(rerun).toContain("<JobModal");
    expect(rerun).toContain("key={`${target.projectId}-${target.instanceId}`}");
    // Both halves of the command come from the one verified target, so no project reaches the
    // launch except the one the pairing was accepted for.
    expect(rerun).toContain("projectId={target.projectId}");
    expect(rerun).not.toMatch(/routeProjectId|owningProjectId|instance\.project_id/u);
  });

  test("nothing offers or opens a rerun without a target that was resolved for it", () => {
    // The control, the card that places it, and the modal all read the one resolved target, so a
    // rerun cannot be offered for an instance that has none or addressed for a project it does not
    // name. Each is matched on the decision rather than its punctuation, so reformatting the JSX
    // around it cannot fail this.
    const button = source("components/results/RerunJobButton.tsx");
    // The link is composed from the target alone: no other project or instance reaches it.
    expect(button).toMatch(
      /projectLinks\.resultRerun\(\s*target\.projectId,\s*target\.instanceId/u,
    );
    expect(button).not.toMatch(/instance\.project_id|routeProjectId|owningProjectId/u);
    // A card with no target offers no control, rather than offering one that composes nothing.
    expect(source("components/instances/InstanceResultCard.tsx")).toMatch(
      /rerunTarget === null\s*\?\s*null/u,
    );
    // A route asking for a rerun opens one only where the instance beneath it offers one.
    expect(source("projects/ProjectResultDetail.tsx")).toMatch(
      /route\.rerun === true\s*&&\s*rerunTarget !== null/u,
    );
  });

  test("an answered rerun leaves no route behind that would offer it again", () => {
    // The rerun's own route is spent once the Data Manager has answered it. Adding the created
    // instance instead of replacing it would leave a sendable rerun of work that has just been run
    // one Back away, so success replaces exactly as Close does.
    const detail = source("projects/ProjectResultDetail.tsx");
    expect(detail).not.toMatch(/router\.push/u);
    expect(detail).toMatch(/onLaunched=\{\(instanceId\) =>\s*void router\.replace/u);
  });
});
