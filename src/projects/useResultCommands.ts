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

  /**
   * Every command refreshes what it addressed whether or not it succeeded, because a rejected
   * command still leaves the displayed result in doubt, and rethrows so its caller can report the
   * rejection itself.
   */
  const command = async (
    mutate: () => Promise<unknown>,
    queryKeys: readonly (readonly unknown[])[],
  ) => {
    try {
      await mutate();
    } finally {
      await invalidate(queryKeys);
    }
  };

  return {
    archiveInstance: async (projectId: string, instanceId: string, archive: boolean) =>
      command(
        () => patchInstance.mutateAsync({ instanceId, params: { archive } }),
        instanceKeys(projectId, instanceId),
      ),

    deleteResultTask: async (projectId: string, taskId: string) =>
      command(
        () => deleteTask.mutateAsync({ taskId }),
        [getGetTasksQueryKey(resultListRequests(projectId).tasks), getGetTaskQueryKey(taskId)],
      ),

    /** Stops a running workflow, or deletes one that has already finished. */
    endRunningWorkflow: async (projectId: string, runningWorkflowId: string, done: boolean) =>
      command(
        () =>
          done
            ? deleteRunningWorkflow.mutateAsync({ runningWorkflowId })
            : stopRunningWorkflow.mutateAsync({ runningWorkflowId }),
        runningWorkflowKeys(projectId, runningWorkflowId),
      ),

    terminateInstance: async (projectId: string, instanceId: string) =>
      command(
        () => terminateInstance.mutateAsync({ instanceId }),
        instanceKeys(projectId, instanceId),
      ),
  };
};
