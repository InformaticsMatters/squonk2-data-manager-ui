import { useMemo } from 'react';
import type { Cell, Column } from 'react-table';

import { Typography } from '@material-ui/core';

import { DataTable } from '../../../DataTable';
import { ProjectUsageChart } from './ProjectUsageChart';
import { StorageUsageChart } from './StorageUsageChart';
import type { ProjectSubscription, StorageSubscription } from './types';
import { useGetProducts } from './useGetProducts';

const formatTierString = (original: string) => {
  return original.charAt(0).toUpperCase() + original.slice(1).toLowerCase();
};

export const ProjectStatsSection = () => {
  const { projectSubscriptions, storageSubscriptions, isLoading, isError, error } =
    useGetProducts();

  const projectsColumns: Column<ProjectSubscription>[] = useMemo(
    () => [
      {
        id: 'projectName',
        accessor: 'name',
        Header: 'Project name',
      },
      {
        id: 'usage',
        Header: 'Usage',
        defaultCanSort: false,
        Cell: ({ row }: Cell<ProjectSubscription>) => {
          return (
            <ProjectUsageChart
              allowance={row.original.coins.allowance}
              instancesUsed={row.original.instance.coins.used}
              storagePredicted={row.original.coins.billing_prediction}
              storageUsed={row.original.storage.coins.used}
            />
          );
        },
      },
      {
        id: 'tier',
        accessor: (row) => formatTierString(row.flavour),
        Header: 'Tier',
      },
      {
        id: 'used',
        accessor: (row) => row.instance.coins.used + row.storage.coins.used,
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

  const storageColumns: Column<StorageSubscription>[] = useMemo(
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
        Cell: ({ row }: Cell<StorageSubscription>) => {
          return (
            <StorageUsageChart
              allowance={row.original.coins.allowance}
              storagePredicted={row.original.coins.billing_prediction}
              storageUsed={row.original.storage.coins.used}
            />
          );
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
    ],
    [],
  );

  return (
    <>
      <Typography gutterBottom component="h3" variant="h2">
        Project Stats
      </Typography>
      <DataTable
        columns={projectsColumns}
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
