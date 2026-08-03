import { useEffect } from "react";

import { type ProductUnitGetResponse } from "@/api/account-server";
import { getGetProductQueryKey } from "@/api/account-server/product";
import { type ProjectDetail } from "@/api/data-manager";
import { getGetProjectQueryKey } from "@/api/data-manager/project";

import { Alert, Button, Container } from "@mui/material";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import Layout from "../layouts/Layout";
import { requireLinkedProject, resolveProjectAncestry } from "./projectAncestry";
import { removeUnavailableProject } from "./projectCache";
import { type ProjectWorkspace, RouteProjectProvider } from "./useRouteProject";

const readCachedWorkspace = (
  queryClient: QueryClient,
  projectId: string,
): ProjectWorkspace | undefined => {
  const project = queryClient.getQueryData<ProjectDetail>(getGetProjectQueryKey(projectId));
  if (project?.project_id !== projectId || !project.product_id) {
    return undefined;
  }
  const product = queryClient.getQueryData<ProductUnitGetResponse>(
    getGetProductQueryKey(project.product_id),
  );
  if (!product) {
    return undefined;
  }
  try {
    return { project, ...resolveProjectAncestry(requireLinkedProject(project), product) };
  } catch {
    return undefined;
  }
};

export const ProjectFailure = ({
  error,
  projectId,
  retry,
}: {
  error: unknown;
  projectId: string;
  retry: () => void;
}) => {
  const queryClient = useQueryClient();
  const failure = classifyTransportFailure(error);
  const unavailable = failure.kind === "forbidden" || failure.kind === "not-found";
  const workspace = unavailable ? undefined : readCachedWorkspace(queryClient, projectId);
  const handleRetry = () => {
    void queryClient
      .refetchQueries({ exact: true, queryKey: getGetProjectQueryKey(projectId), type: "all" })
      .then(retry);
  };

  useEffect(() => {
    if (!unavailable) {
      return;
    }
    removeUnavailableProject(queryClient, localStorage, projectId);
  }, [projectId, queryClient, unavailable]);

  const content = (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert
          action={
            unavailable ? undefined : (
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            )
          }
          severity={unavailable ? "warning" : "error"}
        >
          {unavailable
            ? "This project is unavailable or you no longer have access."
            : "Project data could not be loaded. Retry this project."}
        </Alert>
      </Container>
    </Layout>
  );

  return workspace ? (
    <RouteProjectProvider workspace={workspace}>{content}</RouteProjectProvider>
  ) : (
    content
  );
};
