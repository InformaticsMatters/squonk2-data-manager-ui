import { type ReactNode, useEffect } from "react";

import { useGetProductSuspense } from "@/api/account-server/product";
import { useGetProjectSuspense } from "@/api/data-manager/project";

import { ErrorBoundary } from "@sentry/nextjs";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import { CenterLoader } from "../components/CenterLoader";
import { useSelectedOrganisation } from "../state/organisationSelection";
import {
  type LinkedProject,
  requireLinkedProject,
  resolveProjectAncestry,
} from "./projectAncestry";
import { recordRecentProject } from "./recentProjects";
import { RouteProjectProvider, useRouteProjectId } from "./useRouteProject";

const ProjectFailure = dynamic(
  () => import("./ProjectFailure").then((module) => module.ProjectFailure),
  { ssr: false },
);

const LinkedProductBoundary = ({
  children,
  project,
}: {
  children: ReactNode;
  project: LinkedProject;
}) => {
  const productQuery = useGetProductSuspense(project.product_id, { query: { retry: false } });
  if (productQuery.error) {
    throw productQuery.error;
  }
  const workspace = { project, ...resolveProjectAncestry(project, productQuery.data) };
  const [, setOrganisation, organisationId] = useSelectedOrganisation();

  useEffect(() => {
    if (workspace.organisation.id !== organisationId) {
      setOrganisation(workspace.organisation);
    }
  }, [organisationId, setOrganisation, workspace.organisation]);

  useEffect(() => {
    if (workspace.organisation.id === organisationId) {
      recordRecentProject(localStorage, project.project_id);
    }
  }, [organisationId, project.project_id, workspace.organisation.id]);

  if (workspace.organisation.id !== organisationId) {
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
  const project = requireLinkedProject(projectQuery.data);
  return <LinkedProductBoundary project={project}>{children}</LinkedProductBoundary>;
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
