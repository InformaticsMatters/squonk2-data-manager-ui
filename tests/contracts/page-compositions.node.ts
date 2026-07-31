import { Suspense } from "react";

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

type ElementNode = { props: { children?: unknown; legacyScope?: boolean }; type: unknown };

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
  test("keeps public pages outside authentication and legacy scope hooks", () => {
    const shell = createPublicComposition("content") as unknown as ElementNode;

    expect((shell.type as { name?: string }).name).toBe("PublicShell");
    expect(elementChildren(shell).map((child) => child.type)).toEqual([ApiClientSetup]);
  });

  test("keeps legacy scope hooks in plain application composition", () => {
    const authentication = createApplicationComposition("content") as unknown as ElementNode;
    expect(authentication.type).toBe(AuthenticationBoundary);

    const apiReady = onlyElement(authentication);
    expect(apiReady.type).toBe(ApiClientReadyBoundary);

    const applicationShell = onlyElement(apiReady);
    expect((applicationShell.type as { name?: string }).name).toBe("ApplicationShell");
    expect(applicationShell.props.legacyScope).toBe(true);
  });

  for (const policy of [
    pagePolicies.projects("files"),
    pagePolicies.datasets("list"),
    pagePolicies.administration("charges"),
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
      expect(applicationShell.props.legacyScope).toBe(false);

      const familyShell = onlyElement(applicationShell);
      expect((familyShell.type as { name?: string }).name).toBe(
        `${policy.kind[0].toUpperCase()}${policy.kind.slice(1)}Shell`,
      );
    });
  }
});
