import { type ReactNode, Suspense, useEffect, useMemo } from "react";

import { type ProductUnitGetResponse } from "@/api/account-server";
import { getGetProductSuspenseQueryOptions } from "@/api/account-server/product";
import { type ProjectDetail } from "@/api/data-manager";
import { useGetProjectSuspense } from "@/api/data-manager/project";

import { Box, Container, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { ErrorBoundary } from "@sentry/nextjs";
import {
  QueryErrorResetBoundary,
  usePrefetchQuery,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import { type ProjectSection } from "../application/pagePolicy";
import { PageHead } from "../components/PageHead";
import {
  CardGridSkeleton,
  IdentitySkeleton,
  ListingSkeleton,
  Loading,
} from "../components/skeletons";
import { useSettledQuery } from "../hooks/useSettledQuery";
import { useSelectedOrganisation } from "../state/organisationSelection";
import { ReservedReasonLine } from "./CapabilityButton";
import { readProjectAncestry, resolvedAncestry } from "./projectAncestry";
import { callerAccountRead } from "./projectFacts";
import { recordRecentProject } from "./recentProjects";
import { type ProjectSectionKey, projectSectionLabel, routeProjectSection } from "./routes";
import { runFilter } from "./runFilter";
import { SectionToolbar } from "./SectionToolbar";
import { RouteProjectProvider, useRouteProjectId } from "./useRouteProject";

const ProjectFailure = dynamic(
  () => import("./ProjectFailure").then((module) => module.ProjectFailure),
  { ssr: false },
);

/** What one settled read established: its data, or the error it failed with. */
type SettledReadResult<TData> = { data: TData | undefined; error: unknown };

/**
 * Suspends until one read settles, and hands children whatever it settled on. A read that fails is
 * an outcome rather than a crash, so the workspace still mounts and says what is missing where it
 * is needed. The read stays observed, so a later refetch of it (Manage's subscription retry) lands
 * in place.
 */
const SettledRead = <TData, TError>({
  children,
  options,
}: {
  children: (read: SettledReadResult<TData>) => ReactNode;
  options: UseSuspenseQueryOptions<TData, TError>;
}) => {
  const { data, error } = useSettledQuery(options);
  return children({ data, error });
};

/** The Results rail beside a stack of collapsed result cards, not yet answered. */
const ResultsSkeleton = () => (
  <Loading>
    <Box sx={{ display: "flex", flexDirection: { md: "row", xs: "column" }, gap: 3 }}>
      <Skeleton height={240} sx={{ flex: { md: "0 0 200px" } }} variant="rounded" />
      <Box sx={{ display: "grid", flexGrow: 1, gap: 2, minWidth: 0 }}>
        <Skeleton height={56} variant="rounded" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton height={88} key={index} variant="rounded" />
        ))}
      </Box>
    </Box>
  </Loading>
);

/** The Files listing fills the viewport below the strip, loaded or not, so its footer stays put. */
export const filesListingSx = {
  "& .MuiPaper-root:last-child": {
    height: "calc(100vh - 260px)",
    "@supports (height: 100dvh)": { height: "calc(100dvh - 260px)" },
  },
};

/**
 * The Files listing's headings and the widths it declares, shared with its skeleton so the columns
 * are where they will stay. The file name takes whatever the others leave.
 */
export const filesColumns = {
  name: { header: "File Name" },
  owner: { header: "Owner", width: "15%" },
  mode: { header: "Mode", width: "11%" },
  fileSize: { header: "File size", width: "10%" },
  lastUpdated: { header: "Last updated", width: "15%" },
  actions: { header: "Actions", width: "18%" },
} as const;

/** A Files row's height, set by the small icon buttons in its Actions cell. */
const filesRowHeight = 44;

const sectionSkeletons: Record<ProjectSectionKey, ReactNode> = {
  files: (
    <Box sx={filesListingSx}>
      <ListingSkeleton
        subRowsEnabled
        columns={Object.values(filesColumns)}
        loadingRowHeight={filesRowHeight}
      />
    </Box>
  ),
  manage: <IdentitySkeleton />,
  results: <ResultsSkeleton />,
  run: (
    <>
      {/* The section's own toolbar, disabled: what it offers is known before the catalogue is. */}
      <SectionToolbar
        disabled
        filter={runFilter}
        refreshLabel="Refresh catalogue"
        state={{}}
        onRefresh={() => undefined}
        onStateChange={() => undefined}
      />
      <CardGridSkeleton />
    </>
  ),
};

/**
 * A placeholder for one project section, shaped like its heading and content. The heading is the
 * section's own, which is known from the route; only what the reads answer is a placeholder, and
 * the heading is not marked as one until the section itself renders it. Sections suspend on their
 * own reads into the same boundary, so the project and the section resolve behind one skeleton
 * rather than one after the other.
 */
const ProjectSkeleton = ({ section }: { section: ProjectSectionKey }) => (
  <Container maxWidth={section === "files" || section === "run" ? "xl" : "lg"} sx={{ py: 3 }}>
    {/* Results sets its heading in a row with the result count, spaced below rather than gutters. */}
    <Typography
      component="div"
      gutterBottom={section !== "results"}
      sx={section === "results" ? { mb: 2 } : undefined}
      variant="h4"
    >
      {projectSectionLabel(section)}
    </Typography>
    {sectionSkeletons[section]}
  </Container>
);

/** The skeleton of the section the URL addresses. */
const RouteProjectSkeleton = () => {
  const { asPath } = useRouter();
  return <ProjectSkeleton section={routeProjectSection(asPath, useRouteProjectId() ?? "")} />;
};

/**
 * The index's caption names the organisation, which only its reads can, so a name that wraps it
 * onto a second line would otherwise make the header taller as it arrives. Both lines are held
 * whatever the caption says.
 */
export const projectsIndexCaptionSx = { minHeight: "3em" } as const;

/** The project index, shaped like its heading, filters and rows. */
const ProjectsIndexSkeleton = () => (
  <Container maxWidth="md" sx={{ py: 3 }}>
    <Stack
      direction={{ xs: "column", sm: "row" }}
      sx={{ alignItems: { sm: "flex-end" }, gap: 2, justifyContent: "space-between", mb: 3 }}
    >
      <div>
        {/* Not the page's heading yet: that says the index has arrived. */}
        <Typography component="div" variant="h3">
          Projects
        </Typography>
        {/* The caption names the organisation once its reads have, so it is a placeholder. */}
        <Typography color="text.secondary" sx={projectsIndexCaptionSx}>
          <Skeleton width="80%" />
        </Typography>
      </div>
      {/* Which unit the organisation is offered, and whether either action is available, is what
          the index's reads decide, so only the two buttons' places are held. */}
      <Loading sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        {[217, 166].map((width) => (
          // Each over the reason line the real buttons hold whether or not they have a reason.
          <Stack key={width} spacing={0.5}>
            <Skeleton height={36.5} variant="rounded" width={width} />
            <ReservedReasonLine />
          </Stack>
        ))}
      </Loading>
    </Stack>
    {/* The filters are the index's own, disabled in place until there is a list to narrow. */}
    <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
      <TextField disabled fullWidth label="Search projects" />
      <TextField disabled label="Unit" sx={{ minWidth: { sm: 260 } }} />
    </Stack>
    <Loading sx={{ display: "grid", gap: 1, mt: 2 }}>
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton height={64} key={index} variant="rounded" />
      ))}
    </Loading>
  </Container>
);

/** Project creation and deletion progress: a narrow page with its heading over one form. */
const ProjectFormSkeleton = ({ caption, title }: { caption: string; title: string }) => (
  <Container maxWidth="sm" sx={{ py: 4 }}>
    <Box sx={{ mb: 3 }}>
      <Typography component="div" variant="h3">
        {title}
      </Typography>
      <Typography color="text.secondary">{caption}</Typography>
    </Box>
    <Loading>
      <Skeleton height={240} variant="rounded" />
    </Loading>
  </Container>
);

/**
 * What a Projects page shows before the route, session or API clients are ready, chosen from the
 * page's policy alone because none of those can be read yet.
 */
export const ProjectsSkeleton = ({ section }: { section: ProjectSection }) => {
  switch (section) {
    case "index":
      return <ProjectsIndexSkeleton />;
    case "create":
      return (
        <ProjectFormSkeleton
          caption="Choose who owns the subscription before creating its linked project."
          title="Create project"
        />
      );
    case "deletion":
      return (
        <ProjectFormSkeleton
          caption="This page follows the deletion itself, so it stays available once the project cannot be opened."
          title="Deleting project"
        />
      );
    default:
      return <ProjectSkeleton section={section} />;
  }
};

/**
 * Mounts one project with whatever its Account Server ancestry read established.
 *
 * The product read answers for the subscription, not for the project: the Account Server refuses
 * it to every caller outside the owning unit, which is exactly what a public project opened by a
 * non-member is. A refused product used to fail the whole project, so a project the Data Manager
 * had already returned was reported as unavailable; it now mounts without an ancestry instead, and
 * each action that needed the subscription says what is missing where it is offered.
 *
 * The organisation in effect is only ever moved for a project whose ancestry names one. Without a
 * product there is no organisation this client may read, and adopting the identifier the project
 * carries would point the switcher at an organisation the caller is refused.
 */
const ProjectWorkspaceMount = ({
  children,
  product,
  project,
}: {
  children: ReactNode;
  product: SettledReadResult<ProductUnitGetResponse>;
  project: ProjectDetail;
}) => {
  // One object per answer rather than per render: it is the value of the route project context and
  // of what the chrome reads, and rebuilding it every render would churn both for no new facts.
  const workspace = useMemo(
    () => ({
      ancestry: readProjectAncestry(project, { data: product.data, error: product.error }),
      project,
    }),
    [product.data, product.error, project],
  );
  const { asPath } = useRouter();
  const [, setOrganisation, organisationId] = useSelectedOrganisation();
  const organisation = resolvedAncestry(workspace.ancestry)?.organisation;
  const adopted = organisation === undefined || organisation.id === organisationId;

  useEffect(() => {
    if (organisation && organisation.id !== organisationId) {
      setOrganisation(organisation);
    }
  }, [organisation, organisationId, setOrganisation]);

  // Only a project that resolved into the organisation in effect is recorded, because that is the
  // scope the recent list is read back under; a project with no readable ancestry belongs to no
  // scope this client can name.
  useEffect(() => {
    if (organisation && organisation.id === organisationId) {
      recordRecentProject(localStorage, project.project_id);
    }
  }, [organisation, organisationId, project.project_id]);

  if (!adopted) {
    return <RouteProjectSkeleton />;
  }

  return (
    <RouteProjectProvider workspace={workspace}>
      {/* The project names the tab in place of "Projects", so two projects' tabs differ. */}
      <PageHead
        parts={[projectSectionLabel(routeProjectSection(asPath, project.project_id)), project.name]}
      />
      {children}
    </RouteProjectProvider>
  );
};

/**
 * Waits for the project's product, where it names one, and the caller's account, so the workspace
 * mounts once. The product read is a child rather than a disabled query, because a suspense read
 * cannot be disabled.
 */
const ProjectAncestryBoundary = ({
  children,
  project,
}: {
  children: ReactNode;
  project: ProjectDetail;
}) => {
  const mount = (product: SettledReadResult<ProductUnitGetResponse>) => (
    <SettledRead options={callerAccountRead}>
      {() => (
        <ProjectWorkspaceMount product={product} project={project}>
          {children}
        </ProjectWorkspaceMount>
      )}
    </SettledRead>
  );

  return project.product_id ? (
    <SettledRead
      options={getGetProductSuspenseQueryOptions(project.product_id, { query: { retry: false } })}
    >
      {mount}
    </SettledRead>
  ) : (
    mount({ data: undefined, error: null })
  );
};

const ProjectBoundary = ({ children, projectId }: { children: ReactNode; projectId: string }) => {
  const projectQuery = useGetProjectSuspense(projectId, {
    query: { refetchOnMount: "always", retry: false },
  });
  if (projectQuery.error) {
    throw projectQuery.error;
  }
  if (projectQuery.data.project_id !== projectId) {
    throw new Error(`Project response does not match URL project ${projectId}`);
  }
  return <ProjectAncestryBoundary project={projectQuery.data}>{children}</ProjectAncestryBoundary>;
};

export const ProjectOrganisationBoundary = ({ children }: { children: ReactNode }) => {
  const projectId = useRouteProjectId();
  usePrefetchQuery(callerAccountRead);

  if (!projectId) {
    return children;
  }

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={({ error, resetError }) => (
            <ProjectFailure error={error} projectId={projectId} retry={resetError} />
          )}
          key={projectId}
          onReset={reset}
        >
          <Suspense fallback={<RouteProjectSkeleton />}>
            <ProjectBoundary projectId={projectId}>{children}</ProjectBoundary>
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
