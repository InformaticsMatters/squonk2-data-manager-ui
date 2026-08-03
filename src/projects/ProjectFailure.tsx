import { useEffect } from "react";

import { getGetProductQueryKey } from "@/api/account-server/product";
import { type ProjectDetail } from "@/api/data-manager";
import { getGetProjectQueryKey } from "@/api/data-manager/project";

import { Alert, Button, Container } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import Layout from "../layouts/Layout";
import { removeRecentProject } from "./recentProjects";

const queryKeyContains = (value: unknown, expected: string): boolean =>
  value === expected ||
  (Array.isArray(value) && value.some((item) => queryKeyContains(item, expected))) ||
  (!!value &&
    typeof value === "object" &&
    Object.values(value).some((item) => queryKeyContains(item, expected)));

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

  useEffect(() => {
    if (!unavailable) {
      return;
    }
    const project = queryClient.getQueryData<ProjectDetail>(getGetProjectQueryKey(projectId));
    queryClient.removeQueries({
      predicate: ({ queryKey }) => queryKeyContains(queryKey, projectId),
    });
    if (project?.product_id) {
      queryClient.removeQueries({ queryKey: getGetProductQueryKey(project.product_id) });
    }
    removeRecentProject(localStorage, projectId);
  }, [projectId, queryClient, unavailable]);

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert
          action={
            unavailable ? undefined : (
              <Button color="inherit" size="small" onClick={retry}>
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
};
