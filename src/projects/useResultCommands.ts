import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  usePatchInstance,
  useTerminateInstance,
} from "@/api/data-manager/instance";
import { getGetTaskQueryKey, getGetTasksQueryKey, useDeleteTask } from "@/api/data-manager/task";
import {
  getGetRunningWorkflowQueryKey,
  getGetRunningWorkflowsQueryKey,
  useDeleteRunningWorkflow,
  useStopRunningWorkflow,
} from "@/api/data-manager/workflow";

import { useQueryClient } from "@tanstack/react-query";

import { resultListRequests } from "./resultFacts";

/** The generated cache identities one instance command refreshes: its project's list, and itself. */
const instanceKeys = (projectId: string, instanceId: string) => [
  getGetInstancesQueryKey(resultListRequests(projectId).instances),
  getGetInstanceQueryKey(instanceId),
];

/** The same, for one running workflow. */
const runningWorkflowKeys = (projectId: string, runningWorkflowId: string) => [
  getGetRunningWorkflowsQueryKey(resultListRequests(projectId).workflows),
  getGetRunningWorkflowQueryKey(runningWorkflowId),
];

/**
 * The only owner of Results mutations and of the invalidation that follows them. The generated key
 * factories are the sole cache identity, and every collection key is built from the owning
 * project's own list request, so a command refreshes that project's result collection and the
 * result it changed — never an unprojected collection, and never one belonging to another project.
 */
export const useResultCommands = () => {
  const queryClient = useQueryClient();
  const deleteTask = useDeleteTask();
  const patchInstance = usePatchInstance();
  const terminateInstance = useTerminateInstance();
  const deleteRunningWorkflow = useDeleteRunningWorkflow();
  const stopRunningWorkflow = useStopRunningWorkflow();

  const invalidate = async (queryKeys: readonly (readonly unknown[])[]) => {
    await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };

  return {
    archiveInstance: async (projectId: string, instanceId: string, archive: boolean) => {
      await patchInstance.mutateAsync({ instanceId, params: { archive } });
      await invalidate(instanceKeys(projectId, instanceId));
    },

    deleteResultTask: async (projectId: string, taskId: string) => {
      await deleteTask.mutateAsync({ taskId });
      await invalidate([
        getGetTasksQueryKey(resultListRequests(projectId).tasks),
        getGetTaskQueryKey(taskId),
      ]);
    },

    /**
     * Stops a running workflow, or deletes one that has already finished. The workflow's own state
     * is refreshed either way, because a rejected command still leaves what is displayed in doubt.
     */
    endRunningWorkflow: async (projectId: string, runningWorkflowId: string, done: boolean) => {
      try {
        await (done
          ? deleteRunningWorkflow.mutateAsync({ runningWorkflowId })
          : stopRunningWorkflow.mutateAsync({ runningWorkflowId }));
      } finally {
        await invalidate(runningWorkflowKeys(projectId, runningWorkflowId));
      }
    },

    terminateInstance: async (projectId: string, instanceId: string) => {
      await terminateInstance.mutateAsync({ instanceId });
      await invalidate(instanceKeys(projectId, instanceId));
    },
  };
};
