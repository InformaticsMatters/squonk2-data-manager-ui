import { getGetProductQueryKey } from "@/api/account-server/product";
import { type ProjectDetail } from "@/api/data-manager";
import { getGetProjectQueryKey, getGetProjectsQueryKey } from "@/api/data-manager/project";

import { type QueryClient } from "@tanstack/react-query";

import { removeRecentProject } from "./recentProjects";

/**
 * What a project the caller is confirmed to have lost leaves behind. Its own loaded content and its
 * place in recents go, because content the caller cannot reach must not stay visible; and the
 * caller's project index is refreshed rather than removed, because it is a list of what they can
 * still reach and one of its entries has just stopped being one.
 */
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
  void queryClient
    .invalidateQueries({ exact: true, queryKey: getGetProjectsQueryKey() })
    .catch(() => undefined);
  removeRecentProject(storage, projectId);
};
