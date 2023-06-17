import type {
  ProductDmProjectTier,
  ProductsGetResponseProductsItem,
} from "@squonk/account-server-client";
import { useGetProducts } from "@squonk/account-server-client/product";
import type { ProjectDetail } from "@squonk/data-manager-client";
import { useGetProjects } from "@squonk/data-manager-client/project";

import { MAGIC_UNIT } from "../../constants/units";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";

export type ProjectSubscription = Partial<ProductDmProjectTier> & ProjectDetail;

const isProjectProduct = (
  product: ProductsGetResponseProductsItem,
): product is ProductDmProjectTier =>
  product.product.type === "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION";

/**
 * /**
 * Fetches information about account's project subscriptions.
 * Merges the project owner into each product
 *
 * @param userFilter filter projects keeping only those with `owner` matching `userFilter`
 */
export const useProjectSubscriptions = (userFilter?: string) => {
  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useGetProjects();
  const projects = projectsData?.projects.filter(
    (project) => !userFilter || project.owner === userFilter,
  );

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
  } = useGetProducts();
  const products = productsData?.products.filter(isProjectProduct);

  // const projectProductIds = projects?.map((project) => project.project_id) ?? [];
  // const projectsWithoutProductsInResponse = products?.filter(
  //   (product) => !projectProductIds.includes(product.product.id),
  // );

  let joinedProjectProducts: ProjectSubscription[] =
    projects
      ?.filter((project) => project.unit_id !== MAGIC_UNIT)
      .map((project) => ({
        ...products?.find((product) => product.product.id === project.product_id),
        ...project,
      })) ?? [];

  if (organisation) {
    joinedProjectProducts = joinedProjectProducts.filter(
      (entry) => entry.organisation?.id === organisation.id,
    );
  }
  if (unit) {
    joinedProjectProducts = joinedProjectProducts.filter((entry) => entry.unit_id === unit.id);
  }

  return {
    projectSubscriptions: joinedProjectProducts,
    isLoading: isProjectsLoading || isProductsLoading,
    isError: isProjectsError || isProductsError,
  };
};
