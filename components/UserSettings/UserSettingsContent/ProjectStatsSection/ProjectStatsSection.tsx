import { useMemo } from 'react';
import type { Column } from 'react-table';

import { Typography } from '@material-ui/core';

import { DataTable } from '../../../DataTable';
import type { ProjectSubscription, StorageSubscription } from './types';
import { useGetProducts } from './useGetProducts';

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
      },
      {
        id: 'tier',
        accessor: 'flavour',
        Header: 'Tier',
      },
      {
        id: 'used/quota',
        accessor: (row) =>
          `${row.instance.coins.used + row.storage.coins.used} / ${row.coins.allowance}`,
        Header: 'Used / Quota',
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
      },
      {
        id: 'used/quota',
        accessor: (row) => `${row.storage.coins.used} / ${row.coins.allowance}`,
        Header: 'Used / Quota',
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
