import { useMemo } from "react";
import { type DropzoneState } from "react-dropzone";

import { type ProjectDetail } from "@squonk/data-manager-client";
import { getGetFilesQueryKey } from "@squonk/data-manager-client/file-and-path";

import {
  CloudUploadRounded as CloudUploadRoundedIcon,
  FolderRounded as FolderRoundedIcon,
} from "@mui/icons-material";
import { Box, Breadcrumbs, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { filesize } from "filesize";
import { type LinkProps } from "next/link";
import { useRouter } from "next/router";

import { DataTable } from "../../components/DataTable";
import { NextLink } from "../../components/NextLink";
import { ViewFilePopover } from "../../components/ViewFilePopover/ViewFilePopover";
import { useIsUserAdminOrEditorOfCurrentProject } from "../../hooks/projectHooks";
import { useProjectBreadcrumbs } from "../../hooks/projectPathHooks";
import { toLocalTimeString } from "../../utils/app/datetime";
import { getErrorMessage } from "../../utils/next/orvalError";
import { CreateDirectoryButton } from "./CreateDirectoryButton";
import { FileActions } from "./FileActions";
import { type TableDir, type TableFile } from "./types";
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

const columnHelper = createColumnHelper<TableDir | TableFile>();

/**
 * Data table displaying a project's files with actions to manage the files.
 */
export const ProjectTable = ({ currentProject, openUploadDialog }: ProjectTableProps) => {
  const router = useRouter();

  const isProjectAdminOrEditor = useIsUserAdminOrEditorOfCurrentProject();

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
            } as LinkProps["href"];
            return (
              <NextLink
                color="inherit"
                component="button"
                href={href}
                size="small"
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: "left",
                  maxWidth: "auto",
                  textTransform: "none",
                }}
              >
                <FolderRoundedIcon /> {getValue()}
              </NextLink>
            );
          }
          return <ViewFilePopover fileName={row.fileName} />;
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
    [currentProject.project_id, breadcrumbs, router],
  );

  const dirPath = "/" + breadcrumbs.join("/");
  const getFilesParams = { project_id: currentProject.project_id, path: dirPath };

  const queryClient = useQueryClient();
  const { rows, error, isLoading } = useProjectFileRows(getFilesParams);

  const directories = rows?.filter(isTableDir).map((dir) => dir.path) ?? [];

  return (
    <Box
      sx={{
        "& .MuiPaper-root:last-child": {
          // Set height to fill remaining space, pushing footer just off screen
          // 164px is the height of the header and toolbar
          height: "calc(100vh - 164px)",
          "@supports (height: 100dvh)": { height: "calc(100dvh - 164px)" },
        },
      }}
    >
      <DataTable
        subRowsEnabled
        columns={columns}
        data={rows}
        error={error ? getErrorMessage(error) : undefined}
        getRowId={(row) => row.fullPath}
        isLoading={isLoading}
        toolbarContent={
          <Grid container sx={{ width: "100%" }}>
            <Grid sx={{ display: "flex", alignItems: "center" }}>
              <Breadcrumbs>
                {["root", ...breadcrumbs].map((path, pathIndex) => {
                  const href = {
                    pathname: router.pathname,
                    query: {
                      project: currentProject.project_id,
                      path: breadcrumbs.slice(0, pathIndex),
                    },
                  } as LinkProps["href"];
                  return pathIndex < breadcrumbs.length ? (
                    <NextLink
                      color="inherit"
                      component="button"
                      href={href}
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${pathIndex}-${path}`}
                      size="small"
                      sx={{ textTransform: "none" }}
                    >
                      {path}
                    </NextLink>
                  ) : (
                    // eslint-disable-next-line react/no-array-index-key
                    <Typography key={`${pathIndex}-${path}`}>{path}</Typography>
                  );
                })}
              </Breadcrumbs>
            </Grid>
            <Grid sx={{ marginLeft: "auto" }}>
              <Tooltip title="Upload unmanaged file">
                <IconButton
                  disabled={!isProjectAdminOrEditor}
                  size="large"
                  onClick={openUploadDialog}
                >
                  <CloudUploadRoundedIcon />
                </IconButton>
              </Tooltip>
              <CreateDirectoryButton
                directories={directories}
                path={dirPath}
                // eslint-disable-next-line @typescript-eslint/require-await
                onDirectoryCreated={async () => {
                  void queryClient.invalidateQueries({
                    queryKey: getGetFilesQueryKey(getFilesParams),
                  });
                }}
              />
            </Grid>
          </Grid>
        }
      />
    </Box>
  );
};
