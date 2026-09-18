import { type ReactNode } from "react";

import { Alert, Box, Button, Container, Typography } from "@mui/material";
import { ErrorBoundary } from "@sentry/nextjs";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import { useFamilyRoute } from "../application/FamilyRouteResolution";
import { AdministrationRail } from "./AdministrationRail";
import { presentAdministrationFailure } from "./failures";
import { useOrganisationInEffect } from "./organisationInEffect";
import { type AdministrationRoute } from "./routes";

/**
 * The Administration workspace: the organisation in the masthead, its rail, and one section of it.
 *
 * The organisation is ambient here rather than addressed. `/administration` is that organisation's
 * own page, and every unit reachable from the rail belongs to it. This reverses the earlier rule
 * that Administration listed resources across organisations: the concern behind that rule was
 * *silent* filtering, and an organisation the caller chose, that is named permanently in the
 * masthead, and that is adopted when a link is followed into another one, is not silent.
 */
export const AdministrationFrame = ({ children }: { children: ReactNode }) => {
  const context = useFamilyRoute();
  if (context.policy.kind !== "administration") {
    throw new Error("Administration shell requires an Administration route");
  }
  const organisation = useOrganisationInEffect();
  const route = context.localNotFound ? null : (context.route as AdministrationRoute);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography component="h1" sx={{ mb: 2 }} variant="h3">
        Administration
      </Typography>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 3 }}>
        {/* The rail lists the organisation in effect, so it is absent until there is one. The
            section beside it is not: a unit or subscription URL identifies itself and renders
            whatever organisation the recipient is working as — which is the whole of the
            index-relative versus resource-absolute asymmetry. */}
        {organisation.kind === "organisation" ? (
          <AdministrationRail
            organisationId={organisation.organisationId}
            organisationName={organisation.name}
            route={route}
          />
        ) : null}
        {/* The content pane's floor is deeper than the rail's cap, so the row holding both is
            always taller than the rail and there is travel for it to use even where a section's
            own content is short. */}
        <Box sx={{ flexGrow: 1, minHeight: "calc(100vh - 120px)", minWidth: 0, pb: 6 }}>
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                fallback={({ error, resetError }) => {
                  // One failure contract across every section: a rate limit, a timeout, a lost
                  // connection and a refusal stay distinct and separately recoverable wherever
                  // they happen, and recovering never changes the scope on screen.
                  const presentation = presentAdministrationFailure(
                    classifyTransportFailure(error),
                  );
                  return (
                    <Alert
                      action={
                        presentation.retryable ? (
                          <Button color="inherit" size="small" onClick={resetError}>
                            Retry
                          </Button>
                        ) : undefined
                      }
                      severity={presentation.severity}
                    >
                      {presentation.message}
                    </Alert>
                  );
                }}
                onReset={reset}
              >
                {children}
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </Box>
      </Box>
    </Container>
  );
};
