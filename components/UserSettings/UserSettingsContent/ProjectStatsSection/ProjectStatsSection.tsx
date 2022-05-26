import { useMemo } from 'react';
import type { Cell, Column } from 'react-table';

import type { ProductDmProjectTier, ProductDmStorage } from '@squonk/account-server-client';

import { Box, useTheme } from '@mui/material';

import { useCurrentProjectId } from '../../../../hooks/projectHooks';
import { getErrorMessage } from '../../../../utils/orvalError';
import { formatTierString } from '../../../../utils/productUtils';
import { DataTable } from '../../../DataTable';
import { ProjectActions } from './ProjectActions';
import { ProjectSelectionRadio } from './ProjectSelectionRadio';
import { ProjectUsageChart } from './ProjectUsageChart';
import { StorageUsageChart } from './StorageUsageChart';
import { useProjectSubscriptions } from './useProjectSubscriptions';
import { useStorageSubscriptions } from './useStorageSubscriptions';

/**
 * Displays `Project stats` section in User Settings.
 */
export const ProjectStatsSection = () => {
  const theme = useTheme();
  const { projectId: currentProjectId } = useCurrentProjectId();

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
          return <ProjectSelectionRadio projectProduct={row.original} />;
        },
      },
      {
        id: 'projectName',
        accessor: (row) => row.claim?.name,
        Header: 'Project name',
      },
      {
        id: 'tier',
        accessor: (row) => formatTierString(row.product.flavour ?? ''),
        Header: 'Tier',
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
      {
        id: 'actions',
        Header: 'Actions',
        Cell: ({ row }: Cell<ProductDmProjectTier>) => {
          return <ProjectActions projectProduct={row.original} />;
        },
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
        accessor: (row) => row.product.name,
        defaultCanSort: false,
      },
      {
        id: 'for-layout-only-2',
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
        id: 'used',
        accessor: (row) => row.storage.coins.used,
        Header: 'Used',
      },
      {
        id: 'allowance',
        accessor: (row) => row.coins.allowance,
        Header: 'Allowance',
      },
      {
        id: 'for-layout-only-3',
        defaultCanSort: false,
      },
      {
        id: 'for-layout-only-4',
        defaultCanSort: false,
      },
    ],
    [],
  );

  return (
    <Box display="grid" sx={{ overflowX: 'auto' }}>
      <DataTable
        columns={projectsColumns}
        customRowProps={(row) =>
          row.original.claim?.id === currentProjectId
            ? { style: { backgroundColor: theme.palette.action.hover } }
            : {}
        }
        customTableProps={{
          sx: {
            '& td': {
              wordBreak: 'break-word',
            },
            '& tr': {
              display: 'grid',
              gridTemplateColumns: '61px 1fr 110px 220px 100px 100px 100px 80px',
            },
          },
        }}
        data={projectSubscriptions}
        enableSearch={false}
        error={getErrorMessage(projectSubscriptionsError)}
        isError={isProjectSubscriptionsError}
        isLoading={isProjectSubscriptionsLoading}
        tableContainer={false}
      />
      <DataTable
        columns={storageColumns}
        customTableProps={{
          sx: {
            '& td': {
              wordBreak: 'break-word',
            },
            '& tr': {
              display: 'grid',
              gridTemplateColumns: '61px 1fr 110px 220px 100px 100px 100px 80px',
            },
            '& th:nth-of-type(1) > *, th:nth-of-type(4) > *, th:nth-of-type(7) > *': {
              visibility: 'hidden',
            },
          },
        }}
        data={storageSubscriptions}
        enableSearch={false}
        error={getErrorMessage(storageSubscriptionsError)}
        isError={isStorageSubscriptionsError}
        isLoading={isStorageSubscriptionsLoading}
        tableContainer={false}
      />
    </Box>
  );
};
