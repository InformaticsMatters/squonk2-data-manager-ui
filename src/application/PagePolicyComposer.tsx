import { createContext, type ReactNode, useContext } from "react";

import { type AppProps } from "next/app";

import { FamilyRouteBoundary } from "./FamilyRouteBoundary";
import {
  createApplicationComposition,
  createFamilyComposition,
  createPublicComposition,
} from "./PageCompositions";
import { type PageComposition, type PagePolicy, resolvePageComposition } from "./pagePolicy";

const PageCompositionContext = createContext<PageComposition | null>(null);

export const usePageComposition = (): PageComposition => {
  const composition = useContext(PageCompositionContext);
  if (!composition) {
    throw new Error("Page composition is unavailable");
  }
  return composition;
};

export const PagePolicyComposer = ({
  children,
  policy,
}: {
  children: ReactNode;
  policy: PagePolicy;
}) => {
  const composition = resolvePageComposition(policy);
  let content: ReactNode;
  switch (policy.kind) {
    case "public":
      content = createPublicComposition(children);
      break;
    case "application":
      content = createApplicationComposition(children);
      break;
    case "projects":
    case "datasets":
    case "administration":
      content = (
        <FamilyRouteBoundary policy={policy}>
          {createFamilyComposition(policy, children)}
        </FamilyRouteBoundary>
      );
      break;
  }

  return <PageCompositionContext value={composition}>{content}</PageCompositionContext>;
};

export type PolicyAppComponent = AppProps["Component"] & { pagePolicy: PagePolicy };
