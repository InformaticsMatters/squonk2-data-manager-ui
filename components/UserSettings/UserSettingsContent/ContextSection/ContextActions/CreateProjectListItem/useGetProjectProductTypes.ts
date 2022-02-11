import { useQuery } from 'react-query';

import type { AsError } from '@squonk/account-server-client';

import axios from 'axios';

import { AS_API_URL } from '../../../../../../constants';

type ProductType = {
  service: {
    id: number;
    kind: string;
    name: string;
  };
};

type ProjectProductType = ProductType & {
  type: 'DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION';
  flavour: string;
};

type StorageProductType = ProductType & {
  type: 'DATA_MANAGER_STORAGE_SUBSCRIPTION';
};

type ProductTypeResponse = {
  product_types: (ProjectProductType | StorageProductType)[];
};

/**
 * Fetches all product types and returns only the ones related to projects.
 */
export const useGetProjectProductTypes = () => {
  const { data, ...rest } = useQuery<ProductTypeResponse, AsError>(
    `${AS_API_URL}/product-type`,
    async () => {
      const response = await axios.get<ProductTypeResponse>(`${AS_API_URL}/product-type`);
      return response.data;
    },
  );

  const projectProductTypes =
    data &&
    data.product_types.filter(
      (productType): productType is ProjectProductType =>
        productType.type === 'DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION',
    );

  return {
    projectProductTypes,
    ...rest,
  };
};
