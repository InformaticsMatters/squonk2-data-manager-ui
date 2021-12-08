import { useMemo } from 'react';

import type { ProductDmStorage } from '@squonk/account-server-client';
import { useGetProductsForUnit } from '@squonk/account-server-client/product';

import { UNIT_ID } from '../../../../utils/ASIdentities';

/**
 * Fetches information about account's storage subscriptions.
 */
export const useStorageSubscriptions = () => {
  const { data, isLoading, isError, error } = useGetProductsForUnit(UNIT_ID);

  const storageSubscriptions = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.products.filter(
      (product): product is ProductDmStorage =>
        product.product.type === 'DATA_MANAGER_STORAGE_SUBSCRIPTION',
    );
  }, [data]);

  return { storageSubscriptions, isLoading, isError, error };
};
