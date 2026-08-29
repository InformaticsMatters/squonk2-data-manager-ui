import { type ReactNode, useEffect, useMemo } from "react";

import { useGetProduct } from "@/api/account-server/product";
import { type ProjectDetail } from "@/api/data-manager";
import { useGetProjectSuspense } from "@/api/data-manager/project";

import { ErrorBoundary } from "@sentry/nextjs";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import { CenterLoader } from "../components/CenterLoader";
import { useSelectedOrganisation } from "../state/organisationSelection";
import { readProjectAncestry, resolvedAncestry } from "./projectAncestry";
import { recordRecentProject } from "./recentProjects";
import { RouteProjectProvider, useRouteProjectId } from "./useRouteProject";

const ProjectFailure = dynamic(
  () => import("./ProjectFailure").then((module) => module.ProjectFailure),
  { ssr: false },
);

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
const ProjectAncestryBoundary = ({
  children,
  project,
}: {
  children: ReactNode;
  project: ProjectDetail;
}) => {
  const productId = project.product_id;
  const productQuery = useGetProduct(productId ?? "", {
    query: { enabled: !!productId, retry: false },
  });
  const settled = !productId || !productQuery.isPending;
  // One object per answer rather than per render: it is the value of the route project context and
  // of what the chrome reads, and rebuilding it every render would churn both for no new facts.
  const workspace = useMemo(
    () =>
      settled
        ? {
            ancestry: readProjectAncestry(project, {
              data: productQuery.data,
              error: productQuery.error,
            }),
            project,
          }
        : undefined,
    [productQuery.data, productQuery.error, project, settled],
  );
  const [, setOrganisation, organisationId] = useSelectedOrganisation();
  const organisation = workspace && resolvedAncestry(workspace.ancestry)?.organisation;
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

  if (!workspace || !adopted) {
    return <CenterLoader />;
  }

  return <RouteProjectProvider workspace={workspace}>{children}</RouteProjectProvider>;
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
          <ProjectBoundary projectId={projectId}>{children}</ProjectBoundary>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
