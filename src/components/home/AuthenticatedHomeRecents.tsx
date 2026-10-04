import { type ReactNode } from "react";

import {
  getGetDefaultOrganisationSuspenseQueryOptions,
  getGetOrganisationsSuspenseQueryOptions,
  useGetDefaultOrganisation,
  useGetOrganisationsSuspense,
} from "@/api/account-server/organisation";
import { getGetUnitsSuspenseQueryOptions, useGetUnitsSuspense } from "@/api/account-server/unit";
import { useGetProjectsSuspense } from "@/api/data-manager/project";

import { Box, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { usePrefetchQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useClientSnapshot } from "../../hooks/useClientSnapshot";
import { authClient } from "../../lib/auth-client";
import { ProjectIdentity } from "../../projects/ProjectIdentity";
import { RECENT_PROJECTS_ATTRIBUTE, recentProjectIdsSnapshot } from "../../projects/recentProjects";
import { projectLinks } from "../../projects/routes";
import { useVisibleOrganisations } from "../../state/organisationSelection";
import { FilesIcon, ProjectIcon } from "../icons";
import { SectionBoundary } from "../SectionBoundary";
import { Loading } from "../skeletons";

const RecentProjectsSection = ({ children, hidden }: { children: ReactNode; hidden?: boolean }) => (
  <Box
    component="section"
    sx={[
      { mb: 4 },
      !!hidden && {
        display: "none",
        [`html[${RECENT_PROJECTS_ATTRIBUTE}] &`]: { display: "block" },
      },
    ]}
  >
    <Typography component="h2" sx={{ fontWeight: 850 }} variant="h5">
      Recent projects
    </Typography>
    <Typography color="text.secondary">
      Continue from a direct link. Home itself has no active project scope.
    </Typography>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
      {children}
    </Stack>
  </Box>
);

const RecentProjectCard = ({
  action,
  identity,
  name,
}: {
  action: ReactNode;
  identity: ReactNode;
  name: ReactNode;
}) => (
  <Paper sx={{ flex: 1, p: 2 }} variant="outlined">
    <Typography sx={{ alignItems: "center", display: "flex", fontWeight: 800, gap: 1 }}>
      <ProjectIcon color="action" fontSize="small" />
      {name}
    </Typography>
    {identity}
    {action}
  </Paper>
);

/**
 * The section as it will arrive, one card per remembered project. With no count the server is
 * rendering, and the section is shown only if `_document`'s script found remembered projects.
 */
const RecentProjectsSkeleton = ({ count }: { count?: number }) => (
  <RecentProjectsSection hidden={count === undefined}>
    {Array.from({ length: count ?? 1 }, (_, index) => (
      <Loading key={index}>
        <RecentProjectCard
          // The real control, disabled, so the card is exactly the height it will be.
          action={
            <Button disabled startIcon={<FilesIcon />} sx={{ mt: 1 }}>
              Open files
            </Button>
          }
          identity={
            <Typography
              color="text.secondary"
              component="span"
              sx={{ display: "block", fontSize: 12 }}
            >
              <Skeleton width="60%" />
            </Typography>
          }
          name={<Skeleton sx={{ flex: 1 }} />}
        />
      </Loading>
    ))}
  </RecentProjectsSection>
);

const RecentProjects = ({ recentIds }: { recentIds: readonly string[] }) => {
  // Started together rather than one suspension at a time, so the section arrives once.
  usePrefetchQuery(getGetUnitsSuspenseQueryOptions());
  usePrefetchQuery(getGetOrganisationsSuspenseQueryOptions());
  usePrefetchQuery(getGetDefaultOrganisationSuspenseQueryOptions({ query: { retry: false } }));
  const { data } = useGetProjectsSuspense();
  const { data: units } = useGetUnitsSuspense();
  useGetOrganisationsSuspense();
  const organisations = useVisibleOrganisations();
  // The default organisation is absent rather than exceptional for a deployment that has none, so
  // it is waited for rather than suspended on: its failure must not take the section with it.
  const defaultOrganisationIsPending = useGetDefaultOrganisation({
    query: { retry: false },
  }).isPending;

  if (defaultOrganisationIsPending) {
    return <RecentProjectsSkeleton count={recentIds.length} />;
  }

  const projects = recentIds
    .map((id) => data.projects.find((project) => project.project_id === id))
    .filter((project) => project !== undefined);
  // The default organisation is in this list too, so a project in the caller's personal unit is
  // named rather than falling back to the raw identifier it declares.
  const organisationNames = new Map(
    organisations.map((organisation) => [organisation.id, organisation.name]),
  );
  const unitNames = new Map(
    units.units.flatMap((group) => group.units.map((unit) => [unit.id, unit.name] as const)),
  );

  if (projects.length === 0) {
    return null;
  }

  return (
    <RecentProjectsSection>
      {projects.map((project) => (
        <RecentProjectCard
          action={
            <Button
              component={Link}
              href={projectLinks.files(project.project_id)}
              startIcon={<FilesIcon />}
              sx={{ mt: 1 }}
            >
              Open files
            </Button>
          }
          identity={
            <ProjectIdentity
              organisationLabel={
                organisationNames.get(project.organisation_id ?? "") ?? project.organisation_id
              }
              unitLabel={unitNames.get(project.unit_id ?? "") ?? project.unit_id}
            />
          }
          key={project.project_id}
          name={project.name}
        />
      ))}
    </RecentProjectsSection>
  );
};

export const AuthenticatedHomeRecents = () => {
  const { data: session, isPending } = authClient.useSession();
  // Undefined on the server, which cannot see browser storage.
  const recentIds = useClientSnapshot(() => recentProjectIdsSnapshot(localStorage), undefined);

  if (recentIds === undefined) {
    return <RecentProjectsSkeleton />;
  }
  // Nothing remembered, nothing reserved: the section would only stand empty.
  if (recentIds.length === 0) {
    return null;
  }
  if (isPending) {
    return <RecentProjectsSkeleton count={recentIds.length} />;
  }
  if (!session) {
    return null;
  }

  return (
    <SectionBoundary
      // Recent projects are a shortcut, so a failed read leaves Home as it is without them.
      failure={() => null}
      skeleton={<RecentProjectsSkeleton count={recentIds.length} />}
    >
      <RecentProjects recentIds={recentIds} />
    </SectionBoundary>
  );
};
