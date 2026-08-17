import { expect, test } from "@playwright/test";

import { resolveFamilyRoute } from "../../src/application/familyRoute";
import { pagePolicies } from "../../src/application/pagePolicy";

const projectId = "project-00000000-0000-4000-8000-000000000001";
const datasetId = "dataset-00000000-0000-4000-8000-000000000001";

test.describe("family route enforcement", () => {
  test("withholds a route until the router is ready", () => {
    expect(resolveFamilyRoute(pagePolicies.datasets("list"), "/datasets", false)).toEqual({
      kind: "pending",
    });
  });

  test("exposes only a canonical route", () => {
    expect(
      resolveFamilyRoute(pagePolicies.datasets("list"), "/datasets?search=kinase", true),
    ).toEqual({ kind: "ready", route: { kind: "index", search: "kinase" } });
  });

  test("withholds contaminated state until it has been removed", () => {
    const decision = resolveFamilyRoute(
      pagePolicies.datasets("list"),
      "/datasets?project=secret&label=z&label=a",
      true,
    );

    expect(decision).toEqual({ kind: "replace", canonicalHref: "/datasets?label=a&label=z" });
    expect("route" in decision).toBe(false);
  });

  test("rejects malformed required identity rather than replacing it", () => {
    expect(
      resolveFamilyRoute(pagePolicies.datasets("detail"), "/datasets/not-a-dataset", true),
    ).toEqual({ kind: "not-found" });
  });

  test("retains the Administration task for a malformed child route", () => {
    expect(
      resolveFamilyRoute(
        pagePolicies.administration("charges"),
        "/administration/charges/units/not-a-unit",
        true,
      ),
    ).toEqual({
      kind: "local-not-found",
      parent: { family: "administration", section: "charges" },
    });
  });

  test("retains the project a malformed Projects child route was addressed beneath", () => {
    expect(
      resolveFamilyRoute(
        pagePolicies.projects("run"),
        `/projects/${projectId}/run/jobs/not-a-number`,
        true,
      ),
    ).toEqual({
      kind: "local-not-found",
      parent: { family: "projects", resourceId: projectId, section: "run" },
    });
  });

  test("keeps a malformed child of one section out of another section", () => {
    expect(
      resolveFamilyRoute(
        pagePolicies.projects("results"),
        `/projects/${projectId}/run/jobs/not-a-number`,
        true,
      ),
    ).toEqual({ kind: "not-found" });
  });

  test("rejects a canonical route owned by a different section", () => {
    expect(resolveFamilyRoute(pagePolicies.datasets("viewer"), "/datasets", true)).toEqual({
      kind: "not-found",
    });
    expect(
      resolveFamilyRoute(pagePolicies.projects("results"), `/projects/${projectId}/files`, true),
    ).toEqual({ kind: "not-found" });
    expect(
      resolveFamilyRoute(pagePolicies.datasets("list"), `/datasets/${datasetId}/versions/1`, true),
    ).toEqual({ kind: "not-found" });
  });

  test("dispatches each named family through its own parser", () => {
    expect(
      resolveFamilyRoute(
        pagePolicies.projects("results"),
        `/projects/${projectId}/results?unknown=value`,
        true,
      ),
    ).toEqual({ kind: "replace", canonicalHref: `/projects/${projectId}/results` });
    expect(
      resolveFamilyRoute(
        pagePolicies.administration("charges"),
        "/administration/charges?project=secret",
        true,
      ),
    ).toEqual({ kind: "replace", canonicalHref: "/administration/charges" });
  });
});
