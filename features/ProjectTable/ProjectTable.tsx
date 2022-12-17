import { useMemo } from "react";
import type { DropzoneState } from "react-dropzone";

import type { ProjectDetail } from "@squonk/data-manager-client";

import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import { Breadcrumbs, Grid, IconButton, Typography, useTheme } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import { filesize } from "filesize";
import type { LinkProps } from "next/link";
import { useRouter } from "next/router";
import type { Route } from "nextjs-routes";

import { DataTable } from "../../components/DataTable";
import { NextLink } from "../../components/NextLink";
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

const columnHelper = createColumnHelper<TableFile | TableDir>();

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
  const columns = useMemo(
    () => [
      columnHelper.accessor("fileName", {
        header: "File Name",
        cell: ({ getValue, row: r }) => {
          const row = r.original;

          if (isTableDir(row)) {
            const href = {
              pathname: router.pathname,
              query: { project: currentProject.project_id, path: [...breadcrumbs, row.path] },
            } as LinkProps<Route>["href"];
            return (
              <NextLink
                color="inherit"
                component="button"
                href={href}
                size="small"
                sx={{
                  display: "flex",
                  gap: theme.spacing(1),
                  justifyContent: "left",
                  maxWidth: "auto",
                }}
              >
                <FolderRoundedIcon /> {getValue()}
              </NextLink>
            );
          }
          return <ProjectFileDetails file={row} />;
        },
      }),
      columnHelper.accessor("owner", { header: "Owner" }),
      columnHelper.accessor(
        (row) => {
          if (isTableDir(row)) {
            return "-";
          } else if (row.immutable) {
            return "immutable";
          } else if (row.file_id) {
            return "editable";
          }
          return "unmanaged";
        },
        { id: "mode", header: "Mode" },
      ),
      columnHelper.accessor((row) => (isTableDir(row) ? "-" : row.stat.size), {
        id: "fileSize",
        header: "File size",
        cell: ({ getValue }) => {
          const value = getValue();
          return typeof value === "string" ? value : filesize(value);
        },
      }),
      columnHelper.accessor((row) => (isTableDir(row) ? "-" : row.stat.modified), {
        id: "lastUpdated",
        header: "Last updated",
        cell: ({ getValue, row }) => {
          const value = getValue();
          return isTableDir(row.original) ? value : toLocalTimeString(value, true, true);
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => <FileActions file={row.original} />,
        enableGrouping: false,
      }),
    ],
    [currentProject.project_id, breadcrumbs, router, theme],
  );

  const { rows, error, isLoading } = useProjectFileRows(currentProject.project_id);

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
                } as LinkProps<Route>["href"];
                return pathIndex < breadcrumbs.length ? (
                  <NextLink
                    color="inherit"
                    component="button"
                    href={href}
                    key={`${pathIndex}-${path}`}
                    size="small"
                    sx={{ textTransform: "none" }}
                  >
                    {path}
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
    />
  );
};
