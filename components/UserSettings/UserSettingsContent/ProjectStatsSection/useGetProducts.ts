import { useMemo } from 'react';

import { useAccountServerApi } from '../../../../hooks/useAccountServerApi';
import type { GetProductResponse, ProjectSubscription, StorageSubscription } from './types';

/**
 * Fetches information about account's subscriptions and divides them into project and storage
 * subscriptions.
 */
export const useGetProducts = () => {
  const { data, isLoading, isError, error } = useAccountServerApi<GetProductResponse>('product');

  const { projectSubscriptions, storageSubscriptions } = useMemo(() => {
    const projectSubscriptions: ProjectSubscription[] = [];
    const storageSubscriptions: StorageSubscription[] = [];

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
