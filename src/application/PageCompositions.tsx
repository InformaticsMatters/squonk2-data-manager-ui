import { type ReactNode, Suspense } from "react";

import { ErrorBoundary } from "@sentry/nextjs";
import dynamic from "next/dynamic";
import NextError from "next/error";

import { TopLevelHooks } from "../components/app/TopLevelHooks";
import { AuthenticationBoundary } from "../components/auth/AuthenticationBoundary";
import { CenterLoader } from "../components/CenterLoader";
import { ApiClientReadyBoundary, ApiClientSetup } from "./ApiClientReadyBoundary";
import { type FamilyPagePolicy } from "./familyRoute";

const EventStream = dynamic(
  () => import("../components/eventStream/EventStream").then((module) => module.EventStream),
  { ssr: false },
);

const PublicShell = ({ children }: { children: ReactNode }) => children;
const ProjectsShell = ({ children }: { children: ReactNode }) => children;
const DatasetsShell = ({ children }: { children: ReactNode }) => children;
const AdministrationShell = ({ children }: { children: ReactNode }) => children;

const familyShells = {
  projects: ProjectsShell,
  datasets: DatasetsShell,
  administration: AdministrationShell,
} as const;

const ApplicationShell = ({
  children,
  legacyScope,
}: {
  children: ReactNode;
  legacyScope: boolean;
}) => {
  const content = (
    <>
      <EventStream />
      {children}
    </>
  );
  return legacyScope ? <TopLevelHooks>{content}</TopLevelHooks> : content;
};

export const createPublicComposition = (children: ReactNode) => (
  <PublicShell>
    <ApiClientSetup />
    {children}
  </PublicShell>
);

export const createApplicationComposition = (children: ReactNode) => (
  <AuthenticationBoundary>
    <ApiClientReadyBoundary>
      <ApplicationShell legacyScope>{children}</ApplicationShell>
    </ApiClientReadyBoundary>
  </AuthenticationBoundary>
);

export const createFamilyComposition = (policy: FamilyPagePolicy, children: ReactNode) => {
  const FamilyShell = familyShells[policy.kind];
  return (
    <AuthenticationBoundary>
      <ApiClientReadyBoundary>
        <ErrorBoundary
          fallback={<NextError statusCode={500} />}
          key={`${policy.kind}/${policy.section}`}
        >
          <Suspense fallback={<CenterLoader />}>
            <ApplicationShell legacyScope={false}>
              <FamilyShell>{children}</FamilyShell>
            </ApplicationShell>
          </Suspense>
        </ErrorBoundary>
      </ApiClientReadyBoundary>
    </AuthenticationBoundary>
  );
};
