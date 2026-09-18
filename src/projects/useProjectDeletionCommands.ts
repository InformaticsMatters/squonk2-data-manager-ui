import { getGetProductsQueryKey, useDeleteProduct } from "@/api/account-server/product";
import { getGetProjectsQueryKey, useDeleteProject } from "@/api/data-manager/project";

import { useQueryClient } from "@tanstack/react-query";

/** A project list, rather than one project: only the lists carry a params object, or nothing. */
export const isProjectListQuery = ({ queryKey }: { queryKey: readonly unknown[] }) =>
  typeof queryKey[2] !== "string";

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
      // The list key is a prefix of every single-project key, so a plain invalidation would refetch
      // the project that has just been deleted and answer with the 404 it now deserves. Only the
      // lists are refreshed; what is held for the project itself is discarded by the deletion
      // lifecycle, once the Data Manager confirms it.
      void queryClient
        .invalidateQueries({ predicate: isProjectListQuery, queryKey: getGetProjectsQueryKey() })
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
