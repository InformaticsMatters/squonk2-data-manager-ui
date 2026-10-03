import { type ReactNode, Suspense } from "react";

import { ErrorBoundary } from "@sentry/nextjs";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

/**
 * One section's suspense queries, resolved together behind a placeholder shaped like the section.
 *
 * A read that fails with no data throws, and is caught here rather than by the family, so a
 * refusal stays local to the section that made it: `failure` renders the section's own
 * unavailable state, and its `retry` clears the failed queries and reads them again. The family's
 * `CenterLoader` remains only for whatever suspends outside a section.
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
  failure: (props: { error: unknown; retry: () => void }) => ReactNode;
  skeleton: ReactNode;
}) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        fallback={({ error, resetError }) => <>{failure({ error, retry: resetError })}</>}
        onReset={reset}
      >
        <Suspense fallback={skeleton}>{children}</Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);
