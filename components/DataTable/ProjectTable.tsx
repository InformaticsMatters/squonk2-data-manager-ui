import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { CellProps, Column, PluginHook } from 'react-table';

import type {
  Error as DMError,
  FilesGetResponse,
  ProjectDetail,
} from '@squonk/data-manager-client';
import { useGetFiles } from '@squonk/data-manager-client/file';

import { css } from '@emotion/react';
import { Breadcrumbs, CircularProgress, Link, Typography, useTheme } from '@material-ui/core';
import FolderRoundedIcon from '@material-ui/icons/FolderRounded';
import type { AxiosError } from 'axios';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { useProjectBreadcrumbs } from '../../hooks/projectPathHooks';
import { CenterLoader } from '../CenterLoader';
import type { FileActionsProps } from './Actions/FileActions';
import { DataTable } from './DataTable';
import type { TableDir, TableFile } from './types';
import { useRows } from './useRows';
import { isTableDir } from './utils';

const FileActions = dynamic<FileActionsProps>(
  () => import('./Actions/FileActions').then((mod) => mod.FileActions),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

export const ProjectTable: FC<{ currentProject: ProjectDetail }> = ({ currentProject }) => {
  const theme = useTheme();

  const router = useRouter();

  // Breadcrumbs
  const breadcrumbs = useProjectBreadcrumbs();
  const dirPath = '/' + breadcrumbs.join('/');

  // Table
  const columns: Column<TableFile | TableDir>[] = useMemo(
    () => [
      {
        accessor: 'fileName',
        Header: 'File Name',
        Cell: ({ value, row: r }) => {
          // ? This seems to be a bug in the types?
          const row = r.original as unknown as TableFile | TableDir;
          return isTableDir(row) ? (
            <NextLink
              passHref
              href={{
                pathname: router.pathname,
                query: { project: currentProject.project_id, path: [...breadcrumbs, row.path] },
              }}
            >
              <Link
                color="inherit"
                component="button"
                css={css`
                  display: flex;
                  gap: ${theme.spacing(1)}px;
                `}
                variant="body1"
              >
                <FolderRoundedIcon /> {value}
              </Link>
            </NextLink>
          ) : (
            <Typography variant="body1">{value}</Typography>
          );
        },
      },
      {
        accessor: 'owner',
        Header: 'Owner',
      },
      {
        id: 'mode',
        Header: 'Mode',
        accessor: (row) => {
          if (isTableDir(row)) {
            return '-';
          } else if (row.immutable) {
            return 'immutable';
          } else if (row.file_id) {
            return 'editable';
          }
          return 'unmanaged';
        },
      },
    ],
    [currentProject.project_id, breadcrumbs, router, theme],
  );

  const { data, error, isError, isLoading } = useGetFiles<
    FilesGetResponse,
    AxiosError<DMError> | void
  >({
    project_id: currentProject.project_id,
    path: dirPath,
  });

  const rows = useRows(breadcrumbs, data);

  // react-table plugin to add actions buttons for datasets
  const useActionsColumnPlugin: PluginHook<TableFile | TableDir> = useCallback((hooks) => {
    hooks.visibleColumns.push((columns) => {
      return [
        ...columns,
        {
          id: 'actions',
          groupByBoundary: true, // Ensure normal columns can't be ordered before this
          Header: 'Actions',
          Cell: ({ row }: CellProps<TableFile | TableDir, any>) => (
            <FileActions file={row.original} />
          ),
        },
      ];
    });
  }, []);

  if (isError) {
    return (
      <>
        {error?.message && <Typography color="error">{error.message}</Typography>}
        {error?.response !== undefined && (
          <Typography color="error">{error.response.data.error}</Typography>
        )}
      </>
    );
  }

  if (isLoading || !rows) {
    return <CenterLoader />;
  }

  return (
    <>
      <Typography gutterBottom component="h1" variant="h4">
        Project: {currentProject.name}
      </Typography>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.fullPath}
        ToolbarChild={
          <Breadcrumbs>
            {['root', ...breadcrumbs].map((path, pathIndex) =>
              pathIndex < breadcrumbs.length ? (
                <NextLink
                  passHref
                  href={{
                    pathname: router.pathname,
                    query: {
                      project: currentProject.project_id,
                      path: breadcrumbs.slice(0, pathIndex),
                    },
                  }}
                  key={`${pathIndex}-${path}`}
                >
                  <Link color="inherit" component="button" variant="body1">
                    {path}
                  </Link>
                </NextLink>
              ) : (
                <Typography key={`${pathIndex}-${path}`}>{path}</Typography>
              ),
            )}
          </Breadcrumbs>
        }
        useActionsColumnPlugin={useActionsColumnPlugin}
      />
    </>
  );
};
