import { type ReactNode } from "react";

import { Alert, Button, Container, Stack, Typography } from "@mui/material";
import { ErrorBoundary } from "@sentry/nextjs";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import Layout from "../layouts/Layout";
import { NavigationTab } from "../layouts/navigation/NavigationTab";
import { presentAdministrationFailure } from "./failures";
import { administrationLinks } from "./routes";

const tasks = [
  {
    href: administrationLinks.organisationAccess(),
    label: "Organisation & access",
    section: "organisation-access",
  },
  { href: administrationLinks.subscriptions(), label: "Subscriptions", section: "subscriptions" },
  { href: administrationLinks.charges(), label: "Charges", section: "charges" },
  {
    href: administrationLinks.usageInventory(),
    label: "Usage & inventory",
    section: "usage-inventory",
  },
] as const;

export const AdministrationFrame = ({ children }: { children: ReactNode }) => {
  const { policy } = useFamilyRoute();
  if (policy.kind !== "administration") {
    throw new Error("Administration shell requires an Administration route");
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography component="h1" sx={{ mb: 1 }} variant="h3">
          Administration
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Inspect resources available to you across organisations. The organisation in the masthead
          remains your application identity and does not filter this workspace.
        </Typography>
        <Stack
          aria-label="Administration tasks"
          component="nav"
          direction="row"
          sx={{ borderBottom: 1, borderColor: "divider", mb: 3, overflowX: "auto" }}
        >
          {tasks.map((task) => (
            <NavigationTab
              active={policy.section === task.section}
              href={task.href}
              key={task.section}
              label={task.label}
            />
          ))}
        </Stack>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              fallback={({ error, resetError }) => {
                const failure = classifyTransportFailure(error);
                const presentation =
                  policy.section === "charges"
                    ? presentAdministrationFailure(failure)
                    : {
                        message:
                          failure.kind === "forbidden" || failure.kind === "not-found"
                            ? "Administration data is unavailable or you no longer have access."
                            : "Administration data could not be loaded. Retry this task.",
                        retryable: failure.kind !== "forbidden" && failure.kind !== "not-found",
                        severity:
                          failure.kind === "forbidden" || failure.kind === "not-found"
                            ? ("warning" as const)
                            : ("error" as const),
                      };
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
      </Container>
    </Layout>
  );
};
