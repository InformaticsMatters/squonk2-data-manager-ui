import { useMemo } from "react";

import { useGetProductDefaultStorageCost } from "@squonk/account-server-client/product";

export const useGetStorageCost = () => {
  const { data } = useGetProductDefaultStorageCost();
  const cost = data?.default_storage_cost.cost;
  return useMemo(() => {
    if (typeof cost === "string") {
      return Number.parseFloat(cost);
    }
  }, [cost]);
};
