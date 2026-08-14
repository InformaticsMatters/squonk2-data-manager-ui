import { Fragment, Suspense } from "react";

import { expect, test } from "@playwright/test";
import { ErrorBoundary } from "@sentry/nextjs";

import {
  ApiClientReadyBoundary,
  ApiClientSetup,
} from "../../src/application/ApiClientReadyBoundary";
import {
  createApplicationComposition,
  createFamilyComposition,
  createPublicComposition,
} from "../../src/application/PageCompositions";
import { pagePolicies } from "../../src/application/pagePolicy";
import { AuthenticationBoundary } from "../../src/components/auth/AuthenticationBoundary";
import { ProjectOrganisationBoundary } from "../../src/projects/ProjectOrganisationBoundary";

type ElementNode = { props: { children?: unknown }; type: unknown };

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

test.describe("production page compositions", () => {
  test("keeps public pages outside authentication and the application shell", () => {
    // A public page is its content and the API client setup, wrapped in nothing that could
    // authenticate it or give it application scope.
    const shell = createPublicComposition("content") as unknown as ElementNode;

    // The composition is a bare fragment rather than any component of ours, so there is nothing
    // here that could authenticate the page or give it application scope.
    expect(typeof shell.type).not.toBe("function");
    expect(elementChildren(shell).map((child) => child.type)).toEqual([ApiClientSetup]);
  });

  test("gives a plain application page authentication, API readiness, and the shell alone", () => {
    // The shell holds no scope of its own in either composition, so an application page and a
    // family page mount the same one: nothing here can put a selected unit or project back.
    const authentication = createApplicationComposition("content") as unknown as ElementNode;
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
    [pagePolicies.administration("charges"), Fragment],
  ] as const) {
    test(`renders real ${policy.kind} family boundaries and shell`, () => {
      const authentication = createFamilyComposition(policy, "content") as unknown as ElementNode;
      expect(authentication.type).toBe(AuthenticationBoundary);

      const apiReady = onlyElement(authentication);
      expect(apiReady.type).toBe(ApiClientReadyBoundary);

      const errorBoundary = onlyElement(apiReady);
      expect(errorBoundary.type).toBe(ErrorBoundary);

      const suspense = onlyElement(errorBoundary);
      expect(suspense.type).toBe(Suspense);

      const applicationShell = onlyElement(suspense);
      expect((applicationShell.type as { name?: string }).name).toBe("ApplicationShell");
      expect(Object.keys(applicationShell.props)).toEqual(["children"]);

      const familyShell = onlyElement(applicationShell);
      expect(familyShell.type).toBe(expectedShell);
    });
  }
});
