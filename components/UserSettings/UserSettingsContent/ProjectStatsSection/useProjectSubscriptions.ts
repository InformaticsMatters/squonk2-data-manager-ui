import { useMemo } from 'react';

import type { ProductDmProjectTier } from '@squonk/account-server-client';
import { useGetProductsForUnit } from '@squonk/account-server-client/product';

import { UNIT_ID } from '../../../../utils/ASIdentities';

/**
 * Fetches information about account's project subscriptions.
 */
export const useProjectSubscriptions = () => {
  const { data, isLoading, isError, error } = useGetProductsForUnit(UNIT_ID);

  const projectSubscriptions = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.products
      .filter(
        (product): product is ProductDmProjectTier =>
          product.product.type === 'DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION',
      )
      .filter((product) => Boolean(product.claim));
  }, [data]);

  return { projectSubscriptions, isLoading, isError, error };
};
