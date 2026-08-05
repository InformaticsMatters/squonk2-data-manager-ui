import { getGetTaskQueryKey, getGetTasksQueryKey, useDeleteTask } from "@/api/data-manager/task";

import { useQueryClient } from "@tanstack/react-query";

import { resultListRequests } from "./resultFacts";

/**
 * The only owner of Results mutations and of the invalidation that follows them. The generated key
 * factories are the sole cache identity, so a command refreshes the addressed project's own result
 * collection and the result it changed, and never a collection belonging to another project.
 */
export const useResultCommands = () => {
  const queryClient = useQueryClient();
  const deleteTask = useDeleteTask();

  return {
    deleteResultTask: async (projectId: string, taskId: string) => {
      await deleteTask.mutateAsync({ taskId });
      await Promise.all(
        [getGetTasksQueryKey(resultListRequests(projectId).tasks), getGetTaskQueryKey(taskId)].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  };
};
