import { getGetInstancesQueryKey, useCreateInstance } from "@/api/data-manager/instance";
import { getGetRunningWorkflowsQueryKey, useRunWorkflow } from "@/api/data-manager/workflow";

import { useQueryClient } from "@tanstack/react-query";

import { runCatalogueRequests } from "./runFacts";

/** What one launch produced, named so its caller can open exactly the execution it created. */
export type LaunchOutcome =
  | { kind: "instance"; instanceId: string }
  | { kind: "running-workflow"; runningWorkflowId: string };

/**
 * The only owner of Run mutations and of the invalidation that follows them. Every launch names
 * the project it was made in as a required argument, the generated key factories are the sole
 * cache identity, and every collection key is built from that project's own list request, so a
 * launch can never reach an unprojected collection or one belonging to another project.
 *
 * A launch that was rejected is rethrown rather than reported as a success, so nothing downstream
 * can navigate to an execution that was never created.
 */
export const useRunCommands = () => {
  const queryClient = useQueryClient();
  const createInstance = useCreateInstance();
  const runWorkflow = useRunWorkflow();

  const invalidate = async (queryKeys: readonly (readonly unknown[])[]) => {
    await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };

  return {
    launchInstance: async (
      projectId: string,
      data: { applicationId: string; debug: string; name: string; specification: string },
    ): Promise<LaunchOutcome> => {
      const { instance_id: instanceId } = await createInstance.mutateAsync({
        data: {
          application_id: data.applicationId,
          as_name: data.name,
          debug: data.debug,
          project_id: projectId,
          specification: data.specification,
        },
      });
      await invalidate([getGetInstancesQueryKey(runCatalogueRequests(projectId).instances)]);
      return { kind: "instance", instanceId };
    },

    launchWorkflow: async (
      projectId: string,
      workflowId: string,
      data: { debug: string; name: string; variables: string },
    ): Promise<LaunchOutcome> => {
      const { id } = await runWorkflow.mutateAsync({
        workflowId,
        data: {
          as_name: data.name,
          debug: data.debug,
          project_id: projectId,
          variables: data.variables,
        },
      });
      await invalidate([
        getGetRunningWorkflowsQueryKey(runCatalogueRequests(projectId).runningWorkflows),
      ]);
      return { kind: "running-workflow", runningWorkflowId: id };
    },
  };
};
