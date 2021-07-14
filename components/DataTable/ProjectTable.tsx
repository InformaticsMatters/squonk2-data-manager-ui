import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { CellProps, Column, PluginHook } from 'react-table';

import { ProjectDetail } from '@squonk/data-manager-client';
import { useGetFiles } from '@squonk/data-manager-client/file';

import { css } from '@emotion/react';
import { Breadcrumbs, Link, Typography, useTheme } from '@material-ui/core';
import FolderRoundedIcon from '@material-ui/icons/FolderRounded';

import { DataTable } from './DataTable';
import { FileActions } from './FileActions';
import { useSelectedFiles } from './FileSelectionContext';
import { TableDir, TableFile } from './types';
import { isTableDir } from './utils';

export const ProjectTable: FC<{ currentProject: ProjectDetail }> = memo(({ currentProject }) => {
  const theme = useTheme();

  // Breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  useEffect(() => {
    setBreadcrumbs([]);
  }, [currentProject.project_id]);

  const dirPath = '/' + breadcrumbs.join('/'); // TODO: This shouldn't need a leading slash

  // Selection
  const selectionState = useSelectedFiles();

  // Table
  const columns: Column<TableFile | TableDir>[] = useMemo(
    () => [
      {
        accessor: 'fileName',
        Header: 'File Name',
        Cell: ({ value, row: r }) => {
          const row = r.original as unknown as TableFile | TableDir;
          return isTableDir(row) ? (
            <Link
              color="inherit"
              component="button"
              css={css`
                display: flex;
                gap: ${theme.spacing(1)}px;
              `}
              variant="body1"
              onClick={() => setBreadcrumbs((breadcrumbs) => [...breadcrumbs, row.path])}
            >
              <FolderRoundedIcon /> {value}
            </Link>
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
    [],
  );

  const { data } = useGetFiles({ project_id: currentProject.project_id, path: dirPath });

  const rows = useMemo(() => {
    const files: TableFile[] | undefined = data?.files.map((file) => {
      const { file_id, file_name, owner, immutable } = file;

      let fullPath: string;
      if (breadcrumbs.length > 0) {
        fullPath = breadcrumbs.join('/') + '/' + file_name;
      } else {
        fullPath = file_name;
      }

      return {
        fileName: file_name,
        fullPath,
        file_id,
        owner,
        immutable: immutable as unknown as boolean,
        actions: { projectId: currentProject.project_id },
      };
    });

    const dirs: TableDir[] | undefined = data?.paths.map((path) => {
      let fullPath: string;
      if (breadcrumbs.length > 0) {
        fullPath = breadcrumbs.join('/') + '/' + path;
      } else {
        fullPath = path;
      }

      return {
        fileName: path,
        fullPath,
        path,
      };
    });

    return dirs && files ? [...dirs, ...files] : undefined;
  }, [data]);

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

  if (rows && selectionState) {
    return (
      <>
        <Typography gutterBottom component="h1" variant="h4">
          Project: {currentProject.name}
        </Typography>

        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => {
            return row.fullPath;
          }}
          initialSelection={selectionState.selectedFiles}
          ToolbarChild={
            <Breadcrumbs>
              {['root', ...breadcrumbs].map((path, pathIndex) =>
                pathIndex < breadcrumbs.length ? (
                  <Link
                    color="inherit"
                    component="button"
                    key={`${pathIndex}-${path}`}
                    variant="body1"
                    onClick={() => setBreadcrumbs(breadcrumbs.slice(0, pathIndex))}
                  >
                    {path}
                  </Link>
                ) : (
                  <Typography key={`${pathIndex}-${path}`}>{path}</Typography>
                ),
              )}
            </Breadcrumbs>
          }
          updateSelection={(paths) => selectionState.updateSelectedFiles(paths)}
          useActionsColumnPlugin={useActionsColumnPlugin}
        />
      </>
    );
  }
  return <div>Project Files Loading...</div>;
});
