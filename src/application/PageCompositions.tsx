import { type ComponentType, Fragment, type ReactNode, Suspense } from "react";

import { ErrorBoundary } from "@sentry/nextjs";
import dynamic from "next/dynamic";
import NextError from "next/error";

import { AuthenticationBoundary } from "../components/auth/AuthenticationBoundary";
import { CenterLoader } from "../components/CenterLoader";
import Layout from "../layouts/Layout";
import { ProjectOrganisationBoundary } from "../projects/ProjectOrganisationBoundary";
import { ApiClientReadyBoundary, ApiClientSetup } from "./ApiClientReadyBoundary";
import { type FamilyPagePolicy } from "./familyRoute";
import { FamilyRouteGate, FamilyRouteResolver } from "./FamilyRouteResolution";
import { type PagePolicy } from "./pagePolicy";

const EventStream = dynamic(
  () => import("../components/eventStream/EventStream").then((module) => module.EventStream),
  { ssr: false },
);

/**
 * What a family puts around its own content, for the families that need anything at all.
 *
 * Only Projects does: its content may not mount until the URL project's owning organisation has
 * been adopted. A family with nothing to add is absent here rather than named by a component that
 * hands its children straight back, so this map says which families have a boundary rather than
 * making every family look like it has one.
 */
const familyShells: Partial<
  Record<FamilyPagePolicy["kind"], ComponentType<{ children: ReactNode }>>
> = { projects: ProjectOrganisationBoundary };

/**
 * What every authenticated page is wrapped in, whatever it addresses.
 *
 * It holds no scope of its own. The shell used to mount a hook that read a product and wrote the
 * selected unit and organisation back into global state, which is exactly how the shell's identity
 * could come to disagree with the resource in the URL. Identity is now the persisted organisation
 * alone, resolved through its generated query, and every other scope belongs to a route.
 *
 * It mounts the event stream, which is why it sits above the family's error boundary and Suspense
 * rather than inside them: a connection opened once per authenticated session must survive a
 * workspace change, a section change, and a family crash the caller navigates away from.
 */
const ApplicationShell = ({ children }: { children: ReactNode }) => (
  <>
    <EventStream />
    {children}
  </>
);

export const createPublicComposition = (children: ReactNode) => (
  <>
    <ApiClientSetup />
    {children}
  </>
);

export const createApplicationComposition = (children: ReactNode) => (
  <AuthenticationBoundary>
    <ApiClientReadyBoundary>
      <ApplicationShell>{children}</ApplicationShell>
    </ApiClientReadyBoundary>
  </AuthenticationBoundary>
);

export const createFamilyComposition = (policy: FamilyPagePolicy, children: ReactNode) => {
  const FamilyShell = familyShells[policy.kind] ?? Fragment;
  return (
    <FamilyRouteGate>
      <AuthenticationBoundary>
        <ApiClientReadyBoundary>
          <ApplicationShell>
            {/*
              Keyed on the family alone. Keeping the isolation that matters — a crashed workspace
              resets when the caller leaves it — while a section change no longer resets the
              family's subtree, its route context or its cached reads. Each section is a distinct
              page component, so React still unmounts the previous section's own content.
            */}
            <ErrorBoundary fallback={<NextError statusCode={500} />} key={policy.kind}>
              <Suspense fallback={<CenterLoader />}>
                <FamilyShell>{children}</FamilyShell>
              </Suspense>
            </ErrorBoundary>
          </ApplicationShell>
        </ApiClientReadyBoundary>
      </AuthenticationBoundary>
    </FamilyRouteGate>
  );
};

const createPolicyBranch = (policy: PagePolicy, children: ReactNode) => {
  switch (policy.kind) {
    case "public":
      return createPublicComposition(children);
    case "application":
      return createApplicationComposition(children);
    case "projects":
    case "datasets":
    case "administration":
      return createFamilyComposition(policy, children);
  }
};

/**
 * The whole of a page: the chrome, mounted once, and the branch its policy selects beneath it.
 *
 * The chrome is above every boundary that discards content, so a navigation that changes a
 * workspace or a section changes only the region beneath it. The outermost boundary is the price
 * of that: with nothing above the chrome to catch it, a throw from the masthead, footer or event
 * stream sidebar would otherwise escape the application entirely, and the family's own failure
 * fallback now renders inside the chrome rather than in place of it. The fallback here therefore
 * renders a plain error page and no chrome — the outermost fallback must not depend on anything it
 * might be catching.
 */
export const createPageComposition = (policy: PagePolicy, children: ReactNode) => (
  <ErrorBoundary fallback={<NextError statusCode={500} />}>
    <FamilyRouteResolver policy={policy}>
      <Layout>{createPolicyBranch(policy, children)}</Layout>
    </FamilyRouteResolver>
  </ErrorBoundary>
);
