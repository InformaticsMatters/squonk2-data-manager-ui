import { type ReactNode, Suspense, useEffect, useMemo } from "react";

import { type ProductUnitGetResponse } from "@/api/account-server";
import { getGetProductSuspenseQueryOptions } from "@/api/account-server/product";
import { type ProjectDetail } from "@/api/data-manager";
import { useGetProjectSuspense } from "@/api/data-manager/project";

import { Container, Skeleton, Typography } from "@mui/material";
import { ErrorBoundary } from "@sentry/nextjs";
import {
  QueryErrorResetBoundary,
  usePrefetchQuery,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import { PageHead } from "../components/PageHead";
import { CardGridSkeleton, IdentitySkeleton } from "../components/skeletons";
import { useSettledQuery } from "../hooks/useSettledQuery";
import { useSelectedOrganisation } from "../state/organisationSelection";
import { readProjectAncestry, resolvedAncestry } from "./projectAncestry";
import { callerAccountRead } from "./projectFacts";
import { recordRecentProject } from "./recentProjects";
import { projectSectionLabel, routeProjectSection } from "./routes";
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

/**
 * A placeholder for the section the URL addresses, shaped like its heading and content. The heading
 * is a placeholder too: a section's real heading says its content has arrived.
 */
const ProjectSkeleton = () => {
  const { asPath } = useRouter();
  const section = routeProjectSection(asPath, useRouteProjectId() ?? "");

  return (
    <Container maxWidth={section === "files" || section === "run" ? "xl" : "lg"} sx={{ py: 3 }}>
      <Typography gutterBottom component="div" variant="h4">
        <Skeleton width={160} />
      </Typography>
      {/* ponytail: one shape for every section but Run, until each section has its own (#2114). */}
      {section === "run" ? <CardGridSkeleton /> : <IdentitySkeleton />}
    </Container>
  );
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
    return <ProjectSkeleton />;
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
          <Suspense fallback={<ProjectSkeleton />}>
            <ProjectBoundary projectId={projectId}>{children}</ProjectBoundary>
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
