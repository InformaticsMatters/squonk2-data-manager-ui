import { useMemo } from "react";

import type { ProductDmProjectTier } from "@squonk/account-server-client";
import { useGetProductsForUnit } from "@squonk/account-server-client/product";

import { useOrganisationUnit } from "../../../../context/organisationUnitContext";

/**
 * Fetches information about account's project subscriptions.
 */
export const useProjectSubscriptions = () => {
  const {
    organisationUnit: { unit },
  } = useOrganisationUnit();

  const { data, isLoading, isError, error } = useGetProductsForUnit(unit?.id ?? "", {
    query: { enabled: !!unit?.id },
  });

  const projectSubscriptions = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.products
      .filter(
        (product): product is ProductDmProjectTier =>
          product.product.type === "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      )
      .filter((product) => Boolean(product.claim));
  }, [data]);

  return { projectSubscriptions, isLoading, isError, error };
};
