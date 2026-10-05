import { createContext, type ReactNode, Suspense, use } from "react";

import { ErrorBoundary } from "@sentry/nextjs";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

type SectionFailure = (props: { error: unknown; retry: () => void }) => ReactNode;

const SectionFailureContext = createContext<SectionFailure>(() => null);

/**
 * Sentry renders a function fallback as a component, so an inline one is a new component type on
 * every render and the failure UI would remount, losing its state, whenever the section re-rendered.
 * This one is stable, and reads the section's own failure UI from context.
 */
const SectionFallback = ({ error, resetError }: { error: unknown; resetError: () => void }) => (
  <>{use(SectionFailureContext)({ error, retry: resetError })}</>
);

/**
 * One section's suspense queries, resolved together behind a placeholder shaped like the section.
 *
 * A read that fails with no data throws, and is caught here rather than by the family, so a
 * refusal stays local to the section that made it: `failure` renders the section's own
 * unavailable state, and its `retry` clears the failed queries and reads them again. The family's
 * own skeleton remains only for whatever suspends outside a section.
 *
 * Sentry's boundary has no reset keys, so a section that reads an addressed resource is keyed by
 * that resource, as `ProjectOrganisationBoundary` is, or one resource's failure outlives a
 * navigation to another.
 */
export const SectionBoundary = ({
  children,
  failure,
  skeleton,
}: {
  children: ReactNode;
  failure: SectionFailure;
  skeleton: ReactNode;
}) => (
  <SectionFailureContext value={failure}>
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary fallback={SectionFallback} onReset={reset}>
          <Suspense fallback={skeleton}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  </SectionFailureContext>
);
