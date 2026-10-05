import { type ReactNode, useEffect, useRef } from "react";

import { Alert, Box, Button, Container, Skeleton, Typography } from "@mui/material";
import { useRouter } from "next/router";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import { useFamilyRoute } from "../application/FamilyRouteResolution";
import { RetryIcon } from "../components/icons";
import { SectionBoundary } from "../components/SectionBoundary";
import { AdministrationRail, RAIL_MAX_HEIGHT, RAIL_WIDTH } from "./AdministrationRail";
import { presentAdministrationFailure } from "./failures";
import { useOrganisationInEffect } from "./organisationInEffect";
import { SectionSkeleton } from "./resources";
import { type AdministrationRoute } from "./routes";

/**
 * One section's failure, under the one contract every section shares: a rate limit, a timeout, a
 * lost connection and a refusal stay distinct and separately recoverable wherever they happen, and
 * recovering never changes the scope on screen.
 *
 * The frame outlives a section change, and so would the failure, so leaving the section that
 * failed clears it: the section navigated to reads for itself rather than inheriting the alert.
 */
const SectionFailure = ({ error, retry }: { error: unknown; retry: () => void }) => {
  const { asPath } = useRouter();
  const failedAt = useRef(asPath);

  useEffect(() => {
    if (asPath !== failedAt.current) {
      retry();
    }
  }, [asPath, retry]);

  const presentation = presentAdministrationFailure(classifyTransportFailure(error));
  return (
    <Alert
      action={
        presentation.retryable ? (
          <Button color="inherit" size="small" startIcon={<RetryIcon />} onClick={retry}>
            Retry
          </Button>
        ) : undefined
      }
      severity={presentation.severity}
    >
      {presentation.message}
    </Alert>
  );
};

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
          {/* A section suspends and fails inside the content pane, so the rail beside it and the
              tabs inside a unit are never taken down while a section loads. */}
          <SectionBoundary
            failure={(failure) => <SectionFailure {...failure} />}
            skeleton={<SectionSkeleton />}
          >
            {children}
          </SectionBoundary>
        </Box>
      </Box>
    </Container>
  );
};

/**
 * The frame before the route, session or API clients are ready, so the workspace arrives into the
 * rail and content pane it will occupy. The rail is assumed: the masthead restores the organisation
 * in effect long before these gates open.
 */
export const AdministrationSkeleton = () => (
  <Container maxWidth="xl" sx={{ py: 3 }}>
    {/* Not the page's heading yet: that says the workspace has arrived. */}
    <Typography component="div" sx={{ mb: 2 }} variant="h3">
      Administration
    </Typography>
    <Box sx={{ alignItems: "flex-start", display: "flex", gap: 3 }}>
      <Skeleton
        height={RAIL_MAX_HEIGHT}
        sx={{ display: { md: "block", xs: "none" }, flexShrink: 0 }}
        variant="rounded"
        width={RAIL_WIDTH}
      />
      <Box sx={{ flexGrow: 1, minHeight: "calc(100vh - 120px)", minWidth: 0, pb: 6 }}>
        <SectionSkeleton />
      </Box>
    </Box>
  </Container>
);
