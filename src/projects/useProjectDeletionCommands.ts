import { getGetProductsQueryKey, useDeleteProduct } from "@/api/account-server/product";
import { getGetProjectsQueryKey, useDeleteProject } from "@/api/data-manager/project";

import { useQueryClient } from "@tanstack/react-query";

/**
 * The only owner of the two mutations that remove a project, and of the generated cache identities
 * each of them changes. The two are kept apart deliberately: they address different services, and
 * only a confirmed Data Manager deletion may ever be followed by the subscription one, which the
 * deletion lifecycle — not this module — decides.
 */
export const useProjectDeletionCommands = () => {
  const queryClient = useQueryClient();
  const deleteProject = useDeleteProject();
  const deleteProduct = useDeleteProduct();

  return {
    /** Asks the Data Manager to remove the project, and answers with the task doing the work. */
    deleteProject: async (projectId: string) => {
      const { task_id } = await deleteProject.mutateAsync({ projectId });
      void queryClient
        .invalidateQueries({ queryKey: getGetProjectsQueryKey() })
        .catch(() => undefined);
      return task_id;
    },
    /**
     * Removes the subscription the deleted project held. The generated product key factories all
     * share one prefix, so refreshing it reaches the subscription itself, the caller's own index,
     * and the containing unit's list — which matters here, because the progress route deliberately
     * names no unit and could not invalidate one by hand.
     */
    deleteSubscription: async (productId: string) => {
      await deleteProduct.mutateAsync({ productId });
      void queryClient
        .invalidateQueries({ queryKey: getGetProductsQueryKey() })
        .catch(() => undefined);
    },
  };
};
