import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { CellProps, Column, PluginHook } from 'react-table';

import type { ProjectDetail } from '@squonk/data-manager-client';
import { useGetFiles } from '@squonk/data-manager-client/file';

import { css } from '@emotion/react';
import { Breadcrumbs, Link, Typography, useTheme } from '@material-ui/core';
import FolderRoundedIcon from '@material-ui/icons/FolderRounded';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import type { SavedFile } from '../state/FileSelectionContext';
import { useSelectedFiles } from '../state/FileSelectionContext';
import { useProjectBreadcrumbs } from '../state/projectPathHooks';
import { DataTable } from './DataTable';
import { FileActions } from './FileActions';
import type { TableDir, TableFile } from './types';
import { isDataset, isTableDir } from './utils';

export const ProjectTable: FC<{ currentProject: ProjectDetail }> = ({ currentProject }) => {
  const theme = useTheme();

  const router = useRouter();

  // Breadcrumbs
  const breadcrumbs = useProjectBreadcrumbs();
  const dirPath = '/' + breadcrumbs.join('/'); // TODO: This shouldn't need a leading slash

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
          } else {
            return 'unmanaged';
          }
        },
      },
    ],
    [currentProject.project_id, breadcrumbs, router, theme],
  );

  const { data } = useGetFiles({ project_id: currentProject.project_id, path: dirPath });

  const rows = useMemo(() => {
    const getFullPath = (path: string[], fileName: string) => {
      if (path.length > 0) {
        return path.join('/') + '/' + fileName;
      } else {
        return fileName;
      }
    };

    const files: TableFile[] | undefined = data?.files.map((file) => {
      const { file_id: fileId, file_name: fileName, owner, immutable } = file;

      const fullPath = getFullPath(breadcrumbs, fileName);

      return {
        fileName,
        fullPath,
        file_id: fileId,
        owner,
        immutable,
      };
    });

    const dirs: TableDir[] | undefined = data?.paths.map((path) => {
      const fullPath = getFullPath(breadcrumbs, path);

      return {
        fileName: path,
        fullPath,
        path,
      };
    });

    return dirs && files ? [...dirs, ...files] : undefined;
  }, [data, breadcrumbs]);

  // Selection
  const { selectedFiles, addFile, removeFile } = useSelectedFiles();

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

  if (rows) {
    return (
      <>
        <Typography gutterBottom component="h1" variant="h4">
          Project: {currentProject.name}
        </Typography>

        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => row.fullPath}
          initialSelection={selectedFiles?.map((file) => file.path)}
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
          onSelection={(row, checked) => {
            if (addFile && removeFile) {
              const type = isTableDir(row.original) ? 'dir' : 'file';
              checked
                ? addFile({ path: row.original.fullPath, type })
                : removeFile({ path: row.original.fullPath, type });
            }
          }}
        />
      </>
    );
  }
  return <div>Project Files Loading...</div>;
};
