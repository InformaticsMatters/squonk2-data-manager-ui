import { Fragment, Suspense } from "react";

import { expect, test } from "@playwright/test";
import { ErrorBoundary } from "@sentry/nextjs";

import {
  ApiClientReadyBoundary,
  ApiClientSetup,
} from "../../src/application/ApiClientReadyBoundary";
import { FamilyRouteGate, FamilyRouteResolver } from "../../src/application/FamilyRouteResolution";
import {
  createApplicationComposition,
  createFamilyComposition,
  createPageComposition,
  createPublicComposition,
} from "../../src/application/PageCompositions";
import { pagePolicies } from "../../src/application/pagePolicy";
import { AuthenticationBoundary } from "../../src/components/auth/AuthenticationBoundary";
import Layout from "../../src/layouts/Layout";
import { ProjectOrganisationBoundary } from "../../src/projects/ProjectOrganisationBoundary";

type ElementNode = { key: string | null; props: { children?: unknown }; type: unknown };

const isElementNode = (value: unknown): value is ElementNode =>
  typeof value === "object" && value !== null && "props" in value && "type" in value;

const elementChildren = (element: ElementNode) => {
  const children = Array.isArray(element.props.children)
    ? element.props.children
    : [element.props.children];
  return children.filter(isElementNode);
};

const onlyElement = (element: ElementNode) => {
  const children = elementChildren(element);
  expect(children).toHaveLength(1);
  return children[0];
};

/** Whether a component appears anywhere beneath a node, however deeply it is nested. */
const contains = (value: unknown, component: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some((child) => contains(child, component));
  }
  if (!isElementNode(value)) {
    return false;
  }
  return value.type === component || contains(value.props.children, component);
};

const everyPolicy = [
  pagePolicies.public,
  pagePolicies.application,
  pagePolicies.projects("files"),
  pagePolicies.datasets("list"),
  pagePolicies.administration("organisation-charges"),
] as const;

test.describe("persistent chrome", () => {
  for (const policy of everyPolicy) {
    test(`mounts one chrome above the ${policy.kind} policy branch`, () => {
      // The chrome is composed above the branch rather than inside it, so a caller crossing from
      // one policy to another keeps the same masthead, navigation, footer and sidebar nodes.
      const chromeBoundary = createPageComposition(policy, "content");
      expect(chromeBoundary.type).toBe(ErrorBoundary);

      const resolver = onlyElement(chromeBoundary);
      expect(resolver.type).toBe(FamilyRouteResolver);
      expect((resolver.props as { policy: unknown }).policy).toBe(policy);

      const layout = onlyElement(resolver);
      expect(layout.type).toBe(Layout);
    });
  }

  test("keeps the outermost fallback clear of the chrome it catches", () => {
    // The chrome is now the outermost thing rendered, so its own failure has nothing above it to
    // catch it. A fallback that rendered the layout would re-enter whatever just threw.
    const chromeBoundary = createPageComposition(pagePolicies.projects("files"), "content");
    const { fallback } = chromeBoundary.props as { fallback: unknown };

    expect(contains(fallback, Layout)).toBe(false);
    expect(contains(fallback, FamilyRouteResolver)).toBe(false);
  });
});

test.describe("production page compositions", () => {
  test("keeps public pages outside authentication and the application shell", () => {
    // A public page is its content and the API client setup, wrapped in nothing that could
    // authenticate it or give it application scope.
    const shell = createPublicComposition("content");

    // The composition is a bare fragment rather than any component of ours, so there is nothing
    // here that could authenticate the page or give it application scope.
    expect(typeof shell.type).not.toBe("function");
    expect(elementChildren(shell).map((child) => child.type)).toEqual([ApiClientSetup]);
  });

  test("gives a plain application page authentication, API readiness, and the shell alone", () => {
    // The shell holds no scope of its own in either composition, so an application page and a
    // family page mount the same one: nothing here can put a selected unit or project back.
    const authentication = createApplicationComposition("content");
    expect(authentication.type).toBe(AuthenticationBoundary);

    const apiReady = onlyElement(authentication);
    expect(apiReady.type).toBe(ApiClientReadyBoundary);

    const applicationShell = onlyElement(apiReady);
    expect((applicationShell.type as { name?: string }).name).toBe("ApplicationShell");
    expect(Object.keys(applicationShell.props)).toEqual(["children"]);
  });

  // Only Projects adds anything of its own around family content: its project may not mount until
  // the owning organisation has been adopted. The other two families wrap their content in nothing,
  // which is a fact about the composition rather than a component that exists to be named.
  for (const [policy, expectedShell] of [
    [pagePolicies.projects("files"), ProjectOrganisationBoundary],
    [pagePolicies.datasets("list"), Fragment],
    [pagePolicies.administration("organisation-charges"), Fragment],
  ] as const) {
    test(`renders real ${policy.kind} family boundaries and shell`, () => {
      const gate = createFamilyComposition(policy, "content");
      expect(gate.type).toBe(FamilyRouteGate);

      const authentication = onlyElement(gate);
      expect(authentication.type).toBe(AuthenticationBoundary);

      const apiReady = onlyElement(authentication);
      expect(apiReady.type).toBe(ApiClientReadyBoundary);

      // The event stream is mounted here, above both boundaries beneath it, so neither a family
      // crash nor a suspending section can tear its connection down.
      const applicationShell = onlyElement(apiReady);
      expect((applicationShell.type as { name?: string }).name).toBe("ApplicationShell");
      expect(Object.keys(applicationShell.props)).toEqual(["children"]);

      const errorBoundary = onlyElement(applicationShell);
      expect(errorBoundary.type).toBe(ErrorBoundary);

      const suspense = onlyElement(errorBoundary);
      expect(suspense.type).toBe(Suspense);

      const familyShell = onlyElement(suspense);
      expect(familyShell.type).toBe(expectedShell);
    });

    test(`keys the ${policy.kind} error boundary on the family alone`, () => {
      // A section change must not reset the family's subtree: the project the URL names is read
      // once for the whole visit rather than once per section.
      const gate = createFamilyComposition(policy, "content");
      const applicationShell = onlyElement(onlyElement(onlyElement(gate)));
      const errorBoundary = onlyElement(applicationShell);

      expect(errorBoundary.key).toBe(policy.kind);
    });
  }
});
