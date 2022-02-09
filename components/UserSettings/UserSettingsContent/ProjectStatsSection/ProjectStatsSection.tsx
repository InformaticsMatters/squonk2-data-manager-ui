import { useMemo } from 'react';
import type { Cell, Column } from 'react-table';

import type { ProductDmProjectTier, ProductDmStorage } from '@squonk/account-server-client';

import { css } from '@emotion/react';

import { getErrorMessage } from '../../../../utils/orvalError';
import { DataTable } from '../../../DataTable';
import { ProjectSelectionCheckbox } from './ProjectSelectionCheckbox';
import { ProjectUsageChart } from './ProjectUsageChart';
import { StorageUsageChart } from './StorageUsageChart';
import { useProjectSubscriptions } from './useProjectSubscriptions';
import { useStorageSubscriptions } from './useStorageSubscriptions';

/**
 * Formats the tier string, e.g. GOLD -> Gold.
 */
const formatTierString = (original: string) => {
  return original.charAt(0).toUpperCase() + original.slice(1).toLowerCase();
};

/**
 * Displays `Project stats` section in User Settings.
 */
export const ProjectStatsSection = () => {
  const {
    projectSubscriptions,
    isLoading: isProjectSubscriptionsLoading,
    isError: isProjectSubscriptionsError,
    error: projectSubscriptionsError,
  } = useProjectSubscriptions();

  const {
    storageSubscriptions,
    isLoading: isStorageSubscriptionsLoading,
    isError: isStorageSubscriptionsError,
    error: storageSubscriptionsError,
  } = useStorageSubscriptions();

  const projectsColumns: Column<ProductDmProjectTier>[] = useMemo(
    () => [
      {
        id: 'projectSelection',
        defaultCanSort: false,
        Cell: ({ row }: Cell<ProductDmProjectTier>) => {
          return <ProjectSelectionCheckbox projectProduct={row.original} />;
        },
      },
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
        id: 'for-layout-only-1',
        defaultCanSort: false,
      },
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
        id: 'for-layout-only-2',
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
    <div
      css={css`
        display: grid;
      `}
    >
      <DataTable
        columns={projectsColumns}
        customTableProps={{
          css: css`
            & td {
              word-break: break-word;
            }
            & tr {
              display: grid;
              grid-template-columns: 61px 1fr 240px 110px 110px 110px 110px;
            }
          `,
        }}
        data={projectSubscriptions}
        enableSearch={false}
        error={getErrorMessage(projectSubscriptionsError)}
        isError={isProjectSubscriptionsError}
        isLoading={isProjectSubscriptionsLoading}
        tableContainer={false}
      />
      <br />
      <DataTable
        columns={storageColumns}
        customTableProps={{
          css: css`
            & td {
              word-break: break-word;
            }
            & tr {
              display: grid;
              grid-template-columns: 61px 1fr 240px 220px 110px 110px;
            }
            & th:nth-of-type(1) > *,
            th:nth-of-type(4) > * {
              visibility: hidden;
            }
          `,
        }}
        data={storageSubscriptions}
        enableSearch={false}
        error={getErrorMessage(storageSubscriptionsError)}
        isError={isStorageSubscriptionsError}
        isLoading={isStorageSubscriptionsLoading}
        tableContainer={false}
      />
    </div>
  );
};
