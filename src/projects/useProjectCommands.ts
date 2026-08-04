import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  useAddAdministratorToProject,
} from "@/api/data-manager/project";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";

/**
 * The generated key factories are the sole cache identity for project data, so every command
 * refreshes the addressed project and the caller's project index rather than keeping an aggregate
 * of its own.
 */
const refreshProject = async (queryClient: QueryClient, projectId: string) => {
  await Promise.all(
    [getGetProjectQueryKey(projectId), getGetProjectsQueryKey()].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
};

export const useProjectCommands = () => {
  const queryClient = useQueryClient();
  const addAdministrator = useAddAdministratorToProject();

  return {
    /**
     * Adds the caller to the project's administrators. Only a platform administrator is offered
     * this, and the Data Manager remains the authority: a rejection leaves the displayed project
     * exactly as it was.
     */
    takeProjectAdministration: async (projectId: string, userId: string) => {
      await addAdministrator.mutateAsync({ projectId, userId });
      await refreshProject(queryClient, projectId);
    },
  };
};
