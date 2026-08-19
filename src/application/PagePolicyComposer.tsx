import { createContext, type ReactNode, useContext } from "react";

import { type AppProps } from "next/app";

import { createPageComposition } from "./PageCompositions";
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
}) => (
  <PageCompositionContext value={resolvePageComposition(policy)}>
    {createPageComposition(policy, children)}
  </PageCompositionContext>
);

export type PolicyAppComponent = AppProps["Component"] & { pagePolicy: PagePolicy };
