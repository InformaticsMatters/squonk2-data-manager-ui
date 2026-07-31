import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  pagePolicies,
  resolvePageComposition,
  withPagePolicy,
} from "../../src/application/pagePolicy";

const EmptyPage = () => null;

test.describe("page composition policy", () => {
  test("attaches one required policy to a page", () => {
    const policyPage = withPagePolicy(pagePolicies.application, EmptyPage);
    expect(policyPage).toBe(EmptyPage);
    expect(policyPage.pagePolicy).toEqual(pagePolicies.application);
  });

  test("assigns the production Datasets entry to its named family", () => {
    const source = readFileSync(path.resolve(__dirname, "../../src/pages/datasets.tsx"), "utf8");
    expect(source).toContain('withPagePolicy(pagePolicies.datasets("list"), Datasets)');
  });

  test("selects public composition", () => {
    expect(resolvePageComposition(pagePolicies.public)).toEqual({
      kind: "public",
      layers: ["public-shell", "content"],
    });
  });

  test("selects plain authenticated application composition", () => {
    expect(resolvePageComposition(pagePolicies.application)).toEqual({
      kind: "application",
      layers: ["authentication", "api-client-ready", "application-shell", "content"],
    });
  });

  const familyCases = [
    pagePolicies.projects("index"),
    pagePolicies.projects("create"),
    pagePolicies.projects("deletion"),
    pagePolicies.projects("files"),
    pagePolicies.projects("run"),
    pagePolicies.projects("results"),
    pagePolicies.projects("manage"),
    pagePolicies.datasets("list"),
    pagePolicies.datasets("detail"),
    pagePolicies.datasets("viewer"),
    pagePolicies.administration("organisation-access"),
    pagePolicies.administration("subscriptions"),
    pagePolicies.administration("charges"),
    pagePolicies.administration("usage-inventory"),
  ] as const;

  for (const policy of familyCases) {
    test(`selects ${policy.kind}/${policy.section} composition`, () => {
      expect(resolvePageComposition(policy)).toEqual({
        kind: policy.kind,
        section: policy.section,
        layers: [
          "authentication",
          "api-client-ready",
          `${policy.kind}-error-boundary`,
          `${policy.kind}-suspense`,
          "application-shell",
          `${policy.kind}-shell`,
          "content",
        ],
      });
    });
  }
});
