import { useMemo } from 'react';

import type {
  Error as ASError,
  ProductDmProjectTier,
  ProductDmStorage,
  ProductGetResponse,
} from '@squonk/account-server-client';
import { useGetProducts } from '@squonk/account-server-client/product';

import type { AxiosError } from 'axios';

/**
 * Fetches information about account's subscriptions and divides them into project and storage
 * subscriptions.
 */
export const useProducts = () => {
  const { data, isLoading, isError, error } = useGetProducts<
    ProductGetResponse,
    AxiosError<ASError>
  >();

  const { projectSubscriptions, storageSubscriptions } = useMemo(() => {
    const projectSubscriptions: ProductDmProjectTier[] = [];
    const storageSubscriptions: ProductDmStorage[] = [];

    if (data) {
      data.products.forEach((product) => {
        switch (product.type) {
          case 'DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION':
            projectSubscriptions.push(product);
            break;
          case 'DATA_MANAGER_STORAGE_SUBSCRIPTION':
            storageSubscriptions.push(product);
            break;
        }
      });
    }

    return { projectSubscriptions, storageSubscriptions };
  }, [data]);

  return { projectSubscriptions, storageSubscriptions, isLoading, isError, error };
};
