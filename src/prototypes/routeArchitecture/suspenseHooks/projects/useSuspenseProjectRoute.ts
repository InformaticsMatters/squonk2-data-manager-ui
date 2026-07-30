import { invalidateGetProduct, useGetProductSuspense } from "@/api/account-server/product";
import { invalidateGetProject, useGetProjectSuspense } from "@/api/data-manager/project";

import { useQueryClient } from "@tanstack/react-query";

import { generatedClientAdapter } from "../generatedClientAdapter";

export const useSuspenseProjectRoute = (projectId: string) => {
  const projectQuery = useGetProjectSuspense(projectId, {
    query: { retry: false, staleTime: 60_000 },
    request: { adapter: generatedClientAdapter },
  });
  const productId = projectQuery.data.product_id;

  if (!productId) {
    throw new Error("Project has no Account Server product");
  }

  const productQuery = useGetProductSuspense(productId, {
    query: { retry: false, staleTime: 60_000 },
    request: { adapter: generatedClientAdapter },
  });
  const product = productQuery.data.product;

  return {
    capabilities: { canEditFiles: projectQuery.data.editors.includes("current-user") },
    isFetching: projectQuery.isFetching || productQuery.isFetching,
    product,
    project: projectQuery.data,
  };
};

export const useRefreshSuspenseProjectRoute = (projectId: string, productId: string) => {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      invalidateGetProject(queryClient, projectId),
      invalidateGetProduct(queryClient, productId),
    ]);
};
