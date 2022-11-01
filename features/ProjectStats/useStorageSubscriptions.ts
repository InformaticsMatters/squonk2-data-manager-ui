import { useMemo } from "react";

import type { ProductDmStorage } from "@squonk/account-server-client";
import { useGetProductsForUnit } from "@squonk/account-server-client/product";

import { useSelectedUnit } from "../../state/unitSelection";

/**
 * Fetches information about account's storage subscriptions.
 */
export const useStorageSubscriptions = () => {
  const [unit] = useSelectedUnit();

  const { data, isLoading, error } = useGetProductsForUnit(unit?.id ?? "", {
    query: { enabled: !!unit?.id },
  });

  const storageSubscriptions = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return data.products.filter(
      (product): product is ProductDmStorage =>
        product.product.type === "DATA_MANAGER_STORAGE_SUBSCRIPTION",
    );
  }, [data]);

  return { storageSubscriptions, isLoading: isLoading && unit?.id !== undefined, error };
};
