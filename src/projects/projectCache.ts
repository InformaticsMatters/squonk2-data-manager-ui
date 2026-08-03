import { getGetProductQueryKey } from "@/api/account-server/product";
import { type ProjectDetail } from "@/api/data-manager";
import { getGetProjectQueryKey } from "@/api/data-manager/project";

import { type QueryClient } from "@tanstack/react-query";

import { removeRecentProject } from "./recentProjects";

export const removeUnavailableProject = (
  queryClient: QueryClient,
  storage: Pick<Storage, "getItem" | "setItem">,
  projectId: string,
) => {
  const projectKey = getGetProjectQueryKey(projectId);
  const project = queryClient.getQueryData<ProjectDetail>(projectKey);
  queryClient.removeQueries({ exact: true, queryKey: projectKey });
  if (project?.product_id) {
    queryClient.removeQueries({ exact: true, queryKey: getGetProductQueryKey(project.product_id) });
  }
  removeRecentProject(storage, projectId);
};
