import { useMemo } from "react";

import type { ProductDmProjectTier } from "@squonk/account-server-client";
import { useGetProducts } from "@squonk/account-server-client/product";
import type { ProjectDetail } from "@squonk/data-manager-client";
import { useGetProjects } from "@squonk/data-manager-client/project";

import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";

export type ProductDmProjectTierAndOwner = ProductDmProjectTier & {
  owner?: ProjectDetail["owner"];
};

/**
 * Fetches information about account's project subscriptions.
 * Merges the project owner into each product
 */
export const useProjectSubscriptions = () => {
  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useGetProjects();
  const projects = projectsData?.projects;

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
  } = useGetProducts();
  const products = productsData?.products;

  // const { data, isLoading, isError, error } = useGetProductsForUnit(unit?.id ?? "", {
  //   query: { enabled: !!unit?.id },
  // });
  // const products = data?.products;

  const projectSubscriptions: ProductDmProjectTierAndOwner[] = useMemo(() => {
    const joinedProjectProduct = projects
      ?.map(({ product_id, owner }) => {
        const product = products
          ?.filter(
            (product): product is ProductDmProjectTier =>
              product.product.type === "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
          )
          ?.find((product) => product.product.id === product_id);

        if (product !== undefined) {
          return { ...product, owner };
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== undefined);

    if (joinedProjectProduct) {
      let projects: ProductDmProjectTierAndOwner[] = joinedProjectProduct;
      if (organisation) {
        projects = joinedProjectProduct.filter(
          (project) => project.organisation.id === organisation.id,
        );
      }
      if (unit) {
        projects = joinedProjectProduct.filter((project) => project.unit.id === unit.id);
      }
      return projects;
    }
    return [];
  }, [products, projects, unit, organisation]);

  return {
    projectSubscriptions,
    isLoading: isProjectsLoading || isProductsLoading,
    isError: isProjectsError || isProductsError,
  };
};
