import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  pagePolicies,
  resolvePageComposition,
  withPagePolicy,
} from "../../src/application/pagePolicy";

const EmptyPage = () => null;
/** Stands in for one component handed to two page entries, which is the mistake under test. */
const SharedPage = () => null;

/** How a page entry declares itself: the policy it is composed under, and the component it uses. */
const pageDeclaration = /withPagePolicy\(\s*([^,]+?),\s*([A-Za-z0-9_]+),?\s*\)/u;

test.describe("page composition policy", () => {
  test("attaches one required policy to a page", () => {
    const policyPage = withPagePolicy(pagePolicies.application, EmptyPage);
    expect(policyPage).toBe(EmptyPage);
    expect(policyPage.pagePolicy).toEqual(pagePolicies.application);
  });

  test("refuses one component carrying two policies", () => {
    // The policy is written onto the component itself, so two page entries sharing one component
    // would leave both carrying whichever was evaluated last. Once a link has prefetched a sibling
    // page that is not the page on screen, which resolves a valid URL against the wrong section and
    // answers it with a not-found — silently. It is refused here instead.
    withPagePolicy(pagePolicies.administration("unit-access"), SharedPage);

    expect(() => withPagePolicy(pagePolicies.administration("unit-charges"), SharedPage)).toThrow();
    // Re-declaring the same policy is what a module re-evaluation does, and changes nothing.
    expect(
      withPagePolicy(pagePolicies.administration("unit-access"), SharedPage).pagePolicy,
    ).toEqual(pagePolicies.administration("unit-access"));
  });

  test("no component is shared by page entries declaring different policies", () => {
    // The guard above only fires where both entries are evaluated in one process. This is the
    // static half of the same rule, across the whole page tree. Sharing a component between two
    // entries of the *same* section is fine and the tree already does it; sharing one between two
    // different sections is the silent not-found.
    const pages = path.resolve(__dirname, "../../src/pages");
    const declarations = new Map<string, Set<string>>();

    for (const entry of readdirSync(pages, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".tsx")) {
        continue;
      }
      const declared = pageDeclaration.exec(
        readFileSync(path.join(entry.parentPath, entry.name), "utf8"),
      );
      if (declared) {
        const [, policy, component] = declared;
        declarations.set(
          component,
          (declarations.get(component) ?? new Set()).add(policy.replaceAll(/\s+/gu, "")),
        );
      }
    }

    expect(
      [...declarations].filter(([, policies]) => policies.size > 1).map(([component]) => component),
    ).toEqual([]);
  });

  test("assigns the production Datasets entry to its named family", () => {
    const source = readFileSync(path.resolve(__dirname, "../../src/pages/datasets.tsx"), "utf8");
    expect(source).toContain('withPagePolicy(pagePolicies.datasets("list"), Datasets)');
  });

  test("selects public composition", () => {
    expect(resolvePageComposition(pagePolicies.public)).toEqual({
      kind: "public",
      layers: ["chrome-error-boundary", "route-resolver", "layout", "public-shell", "content"],
    });
  });

  test("selects plain authenticated application composition", () => {
    expect(resolvePageComposition(pagePolicies.application)).toEqual({
      kind: "application",
      layers: [
        "chrome-error-boundary",
        "route-resolver",
        "layout",
        "authentication",
        "api-client-ready",
        "application-shell",
        "content",
      ],
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
    pagePolicies.administration("overview"),
    pagePolicies.administration("organisation-charges"),
    pagePolicies.administration("organisation-usage"),
    pagePolicies.administration("subscription"),
    pagePolicies.administration("subscription-charges"),
    pagePolicies.administration("subscription-entry"),
    pagePolicies.administration("unit-access"),
    pagePolicies.administration("unit-charges"),
    pagePolicies.administration("unit-subscriptions"),
    pagePolicies.administration("unit-usage"),
  ] as const;

  for (const policy of familyCases) {
    test(`selects ${policy.kind}/${policy.section} composition`, () => {
      expect(resolvePageComposition(policy)).toEqual({
        kind: policy.kind,
        section: policy.section,
        layers: [
          "chrome-error-boundary",
          "route-resolver",
          "layout",
          `${policy.kind}-route-gate`,
          "authentication",
          "api-client-ready",
          "application-shell",
          `${policy.kind}-error-boundary`,
          `${policy.kind}-suspense`,
          `${policy.kind}-shell`,
          "content",
        ],
      });
    });
  }
});
