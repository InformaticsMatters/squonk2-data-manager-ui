import { useMemo } from "react";

import type { ProductDmProjectTier } from "@squonk/account-server-client";
import { useGetProductsForUnit } from "@squonk/account-server-client/product";
import type { ProjectDetail } from "@squonk/data-manager-client";
import { useGetProjects } from "@squonk/data-manager-client/project";

import { useSelectedUnit } from "../../../../state/unitSelection";

export type ProductDmProjectTierAndOwner = ProductDmProjectTier & {
  owner?: ProjectDetail["owner"];
};

/**
 * Fetches information about account's project subscriptions.
 * Merges the project owner into each product
 */
export const useProjectSubscriptions = () => {
  const [unit] = useSelectedUnit();

  const { data: projectsData } = useGetProjects();
  const projects = projectsData?.projects;

  const { data, isLoading, isError, error } = useGetProductsForUnit(unit?.id ?? "", {
    query: { enabled: !!unit?.id },
  });

  const projectSubscriptions: ProductDmProjectTierAndOwner[] = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.products
      .filter(
        (product): product is ProductDmProjectTier =>
          product.product.type === "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      )
      .filter((product) => Boolean(product.claim))
      .map((product) => {
        const owner = projects?.find((project) => project.product_id === product.product.id)?.owner;
        return { ...product, owner };
      });
  }, [data, projects]);

  return { projectSubscriptions, isLoading, isError, error };
};
