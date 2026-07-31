import { createContext, type ReactNode, useContext } from "react";

import { type AppProps } from "next/app";
import dynamic from "next/dynamic";

import { TopLevelHooks } from "../components/app/TopLevelHooks";
import { AuthenticationBoundary } from "../components/auth/AuthenticationBoundary";
import { ApiClientReadyBoundary, ApiClientSetup } from "./ApiClientReadyBoundary";
import { type PageComposition, type PagePolicy, resolvePageComposition } from "./pagePolicy";

const PageCompositionContext = createContext<PageComposition | null>(null);

const EventStream = dynamic(
  () => import("../components/eventStream/EventStream").then((module) => module.EventStream),
  { ssr: false },
);

export const usePageComposition = (): PageComposition => {
  const composition = useContext(PageCompositionContext);
  if (!composition) {
    throw new Error("Page composition is unavailable");
  }
  return composition;
};

const ApplicationComposition = ({ children }: { children: ReactNode }) => (
  <AuthenticationBoundary>
    <ApiClientReadyBoundary>
      <TopLevelHooks>
        <>
          <EventStream />
          {children}
        </>
      </TopLevelHooks>
    </ApiClientReadyBoundary>
  </AuthenticationBoundary>
);

export const PagePolicyComposer = ({
  children,
  policy,
}: {
  children: ReactNode;
  policy: PagePolicy;
}) => {
  const composition = resolvePageComposition(policy);
  const content =
    composition.kind === "public" ? (
      <>
        <ApiClientSetup />
        <TopLevelHooks>{children}</TopLevelHooks>
      </>
    ) : (
      <ApplicationComposition>{children}</ApplicationComposition>
    );

  return <PageCompositionContext value={composition}>{content}</PageCompositionContext>;
};

export type PolicyAppComponent = AppProps["Component"] & { pagePolicy: PagePolicy };
