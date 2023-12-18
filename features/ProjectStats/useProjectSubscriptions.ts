import type {
  ProductDmProjectTier,
  ProductsGetResponseProductsItem,
} from "@squonk/account-server-client";
import { useGetProducts } from "@squonk/account-server-client/product";
import type { ProjectDetail } from "@squonk/data-manager-client";
import { useGetProjects } from "@squonk/data-manager-client/project";

import type { PermissionLevelFilter } from "../../components/userContext/filter";
import { filterProjectsByPermissionLevel } from "../../components/userContext/filter";
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
 * Merges the product data into each project
 *
 * @param userFilter filter projects keeping only those with `owner` matching `userFilter`
 */
export const useProjectSubscriptions = ([level, user]: PermissionLevelFilter) => {
  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  // we need products to add in AS info
  const { data: products, isLoading: isProductsLoading } = useGetProducts({
    query: { select: ({ products }) => products.filter(isProjectProduct) },
  });

  const { data: projects, isLoading: isProjectsLoading } = useGetProjects(undefined, {
    query: {
      select: ({ projects }) =>
        filterProjectsByPermissionLevel(level, user, projects)
          .filter((project) => project.unit_id !== MAGIC_UNIT)
          // join available product info into projects
          .map((project) => ({
            ...products?.find((product) => product.product.id === project.product_id),
            ...project,
          }))
          // filter by organisation: keep if either no org is selected or the project is in the selected org
          .filter((entry) => !organisation || entry.organisation_id === organisation.id)
          .filter((entry) => {
            return (
              // keep when no unit selected
              !unit ||
              // or when the unit is selected and the entry unit id matches the selected unit,
              // it's kept only
              (entry.unit_id === unit.id &&
                // when user is a unit member
                (unit.caller_is_member ||
                  // or when the user is a project editor
                  (user && entry.editors.includes(user)) ||
                  // or when the project is public but the user doesn't have specific access
                  !entry.private))
            );
          }) satisfies ProjectSubscription[],
    },
  });

  return {
    projectSubscriptions: (projects ?? []) as ProjectSubscription[],
    isLoading: isProjectsLoading || isProductsLoading,
  };
};
