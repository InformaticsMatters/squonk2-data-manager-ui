import { useCallback, useMemo } from "react";
import type { DropzoneState } from "react-dropzone";
import type { Cell, CellProps, Column, PluginHook } from "react-table";

import type { ProjectDetail } from "@squonk/data-manager-client";

import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import { Breadcrumbs, Grid, IconButton, Link, Typography, useTheme } from "@mui/material";
import { filesize } from "filesize";
import NextLink from "next/link";
import { useRouter } from "next/router";

import { DataTable } from "../../components/DataTable";
import { useIsUserAProjectOwnerOrEditor } from "../../hooks/projectHooks";
import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";
import { toLocalTimeString } from "../../utils/app/datetime";
import { getErrorMessage } from "../../utils/next/orvalError";
import { FileActions } from "./FileActions";
import { ProjectFileDetails } from "./ProjectFileDetails";
import type { TableDir, TableFile } from "./types";
import { useProjectFileRows } from "./useProjectFileRows";
import { isTableDir } from "./utils";

export interface ProjectTableProps {
  /**
   * Project detailing the files to be displayed
   */
  currentProject: ProjectDetail;
  /**
   * Functions that returns props for an input element that opens the file selection UI
   */
  openUploadDialog: DropzoneState["open"];
}

/**
 * Data table displaying a project's files with actions to manage the files.
 */
export const ProjectTable = ({ currentProject, openUploadDialog }: ProjectTableProps) => {
  const theme = useTheme();

  const router = useRouter();

  const isProjectOwnerOrEditor = useIsUserAProjectOwnerOrEditor();

  // Breadcrumbs
  const breadcrumbs = useProjectBreadcrumbs();

  // Table
  const columns: Column<TableFile | TableDir>[] = useMemo(
    () => [
      {
        accessor: "fileName",
        Header: "File Name",
        Cell: ({ value, row: r }) => {
          // ? This seems to be a bug in the types?
          const row = r.original as unknown as TableFile | TableDir;

          if (isTableDir(row)) {
            const href = {
              pathname: router.pathname,
              query: { project: currentProject.project_id, path: [...breadcrumbs, row.path] },
            };
            return (
              <NextLink passHref href={href}>
                <Link
                  color="inherit"
                  component="button"
                  sx={{ display: "flex", gap: theme.spacing(1) }}
                  variant="body1"
                >
                  <FolderRoundedIcon /> {value}
                </Link>
              </NextLink>
            );
          }
          return <ProjectFileDetails file={row} />;
        },
      },
      {
        accessor: "owner",
        Header: "Owner",
      },
      {
        id: "mode",
        Header: "Mode",
        accessor: (row) => {
          if (isTableDir(row)) {
            return "-";
          } else if (row.immutable) {
            return "immutable";
          } else if (row.file_id) {
            return "editable";
          }
          return "unmanaged";
        },
      },
      {
        id: "fileSize",
        Header: "File size",
        accessor: (row) => {
          if (isTableDir(row)) {
            return "-";
          }
          return row.stat.size;
        },
        Cell: ({ value }: { value: string | number }) => {
          if (typeof value === "string") {
            return value;
          }
          return filesize(value);
        },
      },
      {
        id: "lastUpdated",
        Header: "Last updated",
        accessor: (row) => {
          if (isTableDir(row)) {
            return "-";
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

  const { rows, error, isLoading } = useProjectFileRows(currentProject.project_id);

  // react-table plugin to add actions buttons for project files
  const useActionsColumnPlugin: PluginHook<TableFile | TableDir> = useCallback((hooks) => {
    hooks.visibleColumns.push((columns) => {
      return [
        ...columns,
        {
          id: "actions",
          groupByBoundary: true, // Ensure normal columns can't be ordered before this
          Header: "Actions",
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
      isLoading={isLoading}
      ToolbarChild={
        <Grid container>
          <Grid item sx={{ display: "flex", alignItems: "center" }}>
            <Breadcrumbs>
              {["root", ...breadcrumbs].map((path, pathIndex) => {
                const href = {
                  pathname: router.pathname,
                  query: {
                    project: currentProject.project_id,
                    path: breadcrumbs.slice(0, pathIndex),
                  },
                };
                return pathIndex < breadcrumbs.length ? (
                  <NextLink passHref href={href} key={`${pathIndex}-${path}`}>
                    <Link color="inherit" component="button" variant="body1">
                      {path}
                    </Link>
                  </NextLink>
                ) : (
                  <Typography key={`${pathIndex}-${path}`}>{path}</Typography>
                );
              })}
            </Breadcrumbs>
          </Grid>
          <Grid item sx={{ marginLeft: "auto" }}>
            <IconButton disabled={!isProjectOwnerOrEditor} size="large" onClick={openUploadDialog}>
              <CloudUploadRoundedIcon />
            </IconButton>
          </Grid>
        </Grid>
      }
      useActionsColumnPlugin={useActionsColumnPlugin}
    />
  );
};
