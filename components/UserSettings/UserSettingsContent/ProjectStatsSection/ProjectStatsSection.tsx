import { useMemo } from 'react';
import type { Cell, Column } from 'react-table';

import type { ProductDmProjectTier, ProductDmStorage } from '@squonk/account-server-client';

import { css } from '@emotion/react';

import { DataTable } from '../../../DataTable';
import { ProjectUsageChart } from './ProjectUsageChart';
import { StorageUsageChart } from './StorageUsageChart';
import { useProducts } from './useGetProducts';

/**
 * Formats the tier string, e.g. GOLD -> Gold.
 */
const formatTierString = (original: string) => {
  return original.charAt(0).toUpperCase() + original.slice(1).toLowerCase();
};

/**
 * Sizes for table columns in percentages. All column widths used in a table should add up to 100%.
 */
const columnSizes = {
  name: 18,
  usage: 24,
  rest: 14.5,
};

/**
 * Displays `Project stats` section in User Settings.
 */
export const ProjectStatsSection = () => {
  const { projectSubscriptions, storageSubscriptions, isLoading, isError, error } = useProducts();

  const projectsColumns: Column<ProductDmProjectTier>[] = useMemo(
    () => [
      {
        id: 'projectName',
        accessor: (row) => row.claim?.name,
        Header: 'Project name',
      },
      {
        id: 'usage',
        Header: 'Usage',
        defaultCanSort: false,
        Cell: ({ row }: Cell<ProductDmProjectTier>) => {
          return <ProjectUsageChart projectSubscription={row.original} />;
        },
      },
      {
        id: 'tier',
        accessor: (row) => formatTierString(row.product.flavour ?? ''),
        Header: 'Tier',
      },
      {
        id: 'instancesUsed',
        accessor: (row) => row.instance.coins.used,
        Header: 'Instances used',
      },
      {
        id: 'storageUsed',
        accessor: (row) => row.storage.coins.used,
        Header: 'Storage used',
      },
      {
        id: 'allowance',
        accessor: (row) => row.coins.allowance,
        Header: 'Allowance',
      },
    ],
    [],
  );

  const storageColumns: Column<ProductDmStorage>[] = useMemo(
    () => [
      {
        id: 'storageName',
        Header: 'Dataset storage',
        defaultCanSort: false,
      },
      {
        id: 'usage',
        Header: 'Usage',
        defaultCanSort: false,
        Cell: ({ row }: Cell<ProductDmStorage>) => {
          return <StorageUsageChart storageSubscription={row.original} />;
        },
      },
      {
        id: 'for-layout-only',
        defaultCanSort: false,
      },
      {
        id: 'used',
        accessor: (row) => row.storage.coins.used,
        Header: 'Used',
      },
      {
        id: 'allowance',
        accessor: (row) => row.coins.allowance,
        Header: 'Allowance',
      },
    ],
    [],
  );

  return (
    <>
      <DataTable
        columns={projectsColumns}
        customTableProps={{
          css: css`
            table-layout: fixed;
            & td {
              word-break: break-word;
            }
            & th:nth-of-type(1) {
              width: ${columnSizes.name}%;
            }
            & th:nth-of-type(2) {
              width: ${columnSizes.usage}%;
            }
            & th:nth-of-type(3n) {
              width: ${columnSizes.rest}%;
            }
          `,
        }}
        data={projectSubscriptions}
        enableSearch={false}
        error={error}
        isError={isError}
        isLoading={isLoading}
        tableContainer={false}
      />
      <br />
      <DataTable
        columns={storageColumns}
        customTableProps={{
          css: css`
            table-layout: fixed;
            & td {
              word-break: break-word;
            }
            & th:nth-of-type(1) {
              width: ${columnSizes.name}%;
            }
            & th:nth-of-type(2) {
              width: ${columnSizes.usage}%;
            }
            & th:nth-of-type(3) {
              width: ${columnSizes.rest * 2}%;
              visibility: hidden;
            }
            & th:nth-of-type(4n) {
              width: ${columnSizes.rest}%;
            }
            & td:nth-of-type(3) {
              visibility: hidden;
            }
          `,
        }}
        data={storageSubscriptions}
        enableSearch={false}
        error={error}
        isError={isError}
        isLoading={isLoading}
        tableContainer={false}
      />
    </>
  );
};
