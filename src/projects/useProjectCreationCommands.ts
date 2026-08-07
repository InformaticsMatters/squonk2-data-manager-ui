import {
  getGetProductQueryKey,
  getGetProductsForUnitQueryKey,
  getGetProductsQueryKey,
  useCreateUnitProduct,
  useDeleteProduct,
} from "@/api/account-server/product";
import { getGetProjectsQueryKey, useCreateProject } from "@/api/data-manager/project";

import { useQueryClient } from "@tanstack/react-query";

import { type ProjectCreationInput } from "./projectCreation";

/** Owns both generated clients and the generated cache identities affected by project creation. */
export const useProjectCreationCommands = () => {
  const queryClient = useQueryClient();
  const createProduct = useCreateUnitProduct();
  const createProject = useCreateProject();
  const deleteProduct = useDeleteProduct();

  return {
    createProduct: async (input: ProjectCreationInput) => {
      const result = await createProduct.mutateAsync({
        data: {
          flavour: input.flavour,
          name: input.name,
          type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
        },
        unitId: input.unitId,
      });
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetProductsForUnitQueryKey(input.unitId) }),
      ]).catch(() => undefined);
      return result.id;
    },
    createProject: async (input: ProjectCreationInput, productId: string) => {
      const result = await createProject.mutateAsync({
        data: { name: input.name, private: input.isPrivate, tier_product_id: productId },
      });
      void queryClient
        .invalidateQueries({ queryKey: getGetProjectsQueryKey() })
        .catch(() => undefined);
      return result.project_id;
    },
    deleteProduct: async (productId: string) => {
      await deleteProduct.mutateAsync({ productId });
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) }),
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }),
      ]).catch(() => undefined);
    },
  };
};
