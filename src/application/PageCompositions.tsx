import { type ReactNode, Suspense } from "react";

import { ErrorBoundary } from "@sentry/nextjs";
import dynamic from "next/dynamic";
import NextError from "next/error";

import { AuthenticationBoundary } from "../components/auth/AuthenticationBoundary";
import { CenterLoader } from "../components/CenterLoader";
import { ProjectOrganisationBoundary } from "../projects/ProjectOrganisationBoundary";
import { ApiClientReadyBoundary, ApiClientSetup } from "./ApiClientReadyBoundary";
import { type FamilyPagePolicy } from "./familyRoute";

const EventStream = dynamic(
  () => import("../components/eventStream/EventStream").then((module) => module.EventStream),
  { ssr: false },
);

const PublicShell = ({ children }: { children: ReactNode }) => children;
const ProjectsShell = ({ children }: { children: ReactNode }) => (
  <ProjectOrganisationBoundary>{children}</ProjectOrganisationBoundary>
);
const DatasetsShell = ({ children }: { children: ReactNode }) => children;
const AdministrationShell = ({ children }: { children: ReactNode }) => children;
const familyShells = {
  projects: ProjectsShell,
  datasets: DatasetsShell,
  administration: AdministrationShell,
} as const;

/**
 * What every authenticated page is wrapped in, whatever it addresses.
 *
 * It holds no scope of its own. The shell used to mount a hook that read a product and wrote the
 * selected unit and organisation back into global state, which is exactly how the shell's identity
 * could come to disagree with the resource in the URL. Identity is now the persisted organisation
 * alone, resolved through its generated query, and every other scope belongs to a route.
 */
const ApplicationShell = ({ children }: { children: ReactNode }) => (
  <>
    <EventStream />
    {children}
  </>
);

export const createPublicComposition = (children: ReactNode) => (
  <PublicShell>
    <ApiClientSetup />
    {children}
  </PublicShell>
);

export const createApplicationComposition = (children: ReactNode) => (
  <AuthenticationBoundary>
    <ApiClientReadyBoundary>
      <ApplicationShell>{children}</ApplicationShell>
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
            <ApplicationShell>
              <FamilyShell>{children}</FamilyShell>
            </ApplicationShell>
          </Suspense>
        </ErrorBoundary>
      </ApiClientReadyBoundary>
    </AuthenticationBoundary>
  );
};
