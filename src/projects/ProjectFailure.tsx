import { useEffect, useMemo } from "react";

import { type ProductUnitGetResponse } from "@/api/account-server";
import { getGetProductQueryKey } from "@/api/account-server/product";
import { type ProjectDetail } from "@/api/data-manager";
import { getGetProjectQueryKey } from "@/api/data-manager/project";

import { Alert, Button, Container } from "@mui/material";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import { AuthButton } from "../components/auth/AuthButton";
import { resolveProjectWorkspaceFailure } from "./failures";
import { requireLinkedProject, resolveProjectAncestry } from "./projectAncestry";
import { settleProjectWorkspaceFailure } from "./projectCache";
import { usePublishRouteProjectResolution } from "./routeProjectResolution";
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
    return {
      ancestry: {
        kind: "resolved",
        ...resolveProjectAncestry(requireLinkedProject(project), product),
      },
      project,
    };
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
  const failure = resolveProjectWorkspaceFailure(error, projectId);
  // A project this read said nothing about is still the project the caller had, so whatever was
  // loaded for it stays displayed underneath the failure.
  const workspace = failure.discardsProject
    ? undefined
    : readCachedWorkspace(queryClient, projectId);
  const handleRetry = () => {
    void queryClient
      .refetchQueries({ exact: true, queryKey: getGetProjectQueryKey(projectId), type: "all" })
      .then(retry);
  };

  // What the failure decided, rather than the failure itself: a resolution is a fresh object every
  // render, and settling discards cache entries and invalidates the project index, which is not
  // something to do again on each one.
  const { discardsProject } = failure;
  useEffect(() => {
    settleProjectWorkspaceFailure({ discardsProject }, queryClient, localStorage, projectId);
  }, [discardsProject, projectId, queryClient]);

  // Tell the identity strip in the chrome that this project failed, so it stops showing the
  // placeholder that means the project is still on its way. A cached workspace is a resolution of
  // its own and is published by the provider below, so only a failure with nothing to show is
  // reported here.
  usePublishRouteProjectResolution(
    useMemo(
      () => (workspace ? null : { projectId, status: "failed" as const }),
      [projectId, workspace],
    ),
  );

  // The route back is the failure's own: a read worth making again offers the retry, a session
  // that lapsed offers the sign-in that is the only thing able to recover it, and an answer
  // nothing the caller does can change offers neither rather than a control that cannot work.
  const remedy = {
    none: undefined,
    reauthenticate: <AuthButton color="inherit" mode="login" size="small" />,
    retry: (
      <Button color="inherit" size="small" onClick={handleRetry}>
        Retry
      </Button>
    ),
  }[failure.remedy];

  const content = (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Alert action={remedy} severity={failure.severity}>
        {failure.message}
      </Alert>
    </Container>
  );

  return workspace ? (
    <RouteProjectProvider workspace={workspace}>{content}</RouteProjectProvider>
  ) : (
    content
  );
};
