import { useCallback, useMemo } from 'react';
import type { Cell, CellProps, Column, PluginHook } from 'react-table';

import type { ProjectDetail } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import { Breadcrumbs, CircularProgress, Link, Typography, useTheme } from '@material-ui/core';
import FolderRoundedIcon from '@material-ui/icons/FolderRounded';
import fileSize from 'filesize';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { useProjectBreadcrumbs } from '../../hooks/projectPathHooks';
import { getErrorMessage } from '../../utils/orvalError';
import { DataTable } from '../DataTable';
import { toLocalTimeString } from '../LocalTime';
import type { FileActionsProps } from './FileActions';
import { ProjectFileDetails } from './ProjectFileDetails';
import type { TableDir, TableFile } from './types';
import { useProjectFileRows } from './useProjectFileRows';
import { isTableDir } from './utils';

const FileActions = dynamic<FileActionsProps>(
  () => import('./FileActions').then((mod) => mod.FileActions),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

export interface ProjectTable {
  /**
   * Project detailing the files to be displayed
   */
  currentProject: ProjectDetail;
}

/**
 * Data table displaying a project's files with actions to manage the files.
 */
export const ProjectTable = ({ currentProject }: ProjectTable) => {
  const theme = useTheme();

  const router = useRouter();

  // Breadcrumbs
  const breadcrumbs = useProjectBreadcrumbs();

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
            <ProjectFileDetails file={row} />
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
      {
        id: 'fileSize',
        Header: 'File size',
        accessor: (row) => {
          if (isTableDir(row)) {
            return '-';
          }
          return row.stat.size;
        },
        Cell: ({ value }: { value: string | number }) => {
          if (typeof value === 'string') {
            return value;
          }
          return fileSize(value);
        },
      },
      {
        id: 'lastUpdated',
        Header: 'Last updated',
        accessor: (row) => {
          if (isTableDir(row)) {
            return '-';
          }
          return row.stat.modified;
        },
        Cell: ({ value, row }: Cell<TableFile | TableDir>) => {
          if (isTableDir(row.original)) {
            return value;
          }
          return toLocalTimeString(value, true, true);
        },
      },
    ],
    [currentProject.project_id, breadcrumbs, router, theme],
  );

  const { rows, error, isError, isLoading } = useProjectFileRows(currentProject.project_id);

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

  return (
    <DataTable
      columns={columns}
      data={rows}
      error={getErrorMessage(error)}
      getRowId={(row) => row.fullPath}
      isError={isError}
      isLoading={isLoading}
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
  );
};
