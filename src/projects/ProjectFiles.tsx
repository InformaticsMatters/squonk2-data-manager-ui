import { useMemo } from "react";

import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Breadcrumbs,
  Container,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import { filesize } from "filesize";
import NextError from "next/error";

import { type FamilyRoute } from "../application/familyRoute";
import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { CenterLoader } from "../components/CenterLoader";
import { DataTable } from "../components/DataTable";
import { NextLink } from "../components/NextLink";
import { ViewFilePopover } from "../components/ViewFilePopover/ViewFilePopover";
import Layout from "../layouts/Layout";
import { toLocalTimeString } from "../utils/app/datetime";
import { capabilityReason, evaluateProjectFileMutationCapability } from "./capabilities";
import {
  childFilesystemPath,
  existingDirectoryNames,
  fileRowMode,
  filesystemBreadcrumbs,
  filesystemPathOf,
  filesystemRoot,
  isDirectoryRow,
  type ProjectFileRow,
} from "./fileFacts";
import { type ProjectFacts, useProjectFacts } from "./projectFacts";
import { ProjectFileActions } from "./ProjectFileActions";
import { CreateDirectoryControl, UploadFileControl } from "./ProjectFileToolbarActions";
import { ProjectFileUpload } from "./ProjectFileUpload";
import { projectLinks, type ProjectRoute } from "./routes";
import { SectionReadAlerts } from "./SectionReadAlerts";
import { resolveProjectSectionRoute } from "./sectionRoute";
import { useProjectFiles } from "./useProjectFiles";

type FilesRoute = Extract<ProjectRoute, { kind: "files" }>;

const isFilesRoute = (route: FamilyRoute): route is FilesRoute => route.kind === "files";

const columnHelper = createColumnHelper<ProjectFileRow>();

/**
 * The directories this path walks through, each addressing its own canonical Files route of the
 * same project. Only Files owns the path, so a breadcrumb carries nothing else and reaches nowhere
 * but Files.
 */
const PathBreadcrumbs = ({ path, projectId }: { path: string; projectId: string }) => {
  const breadcrumbs = filesystemBreadcrumbs(path);

  return (
    <Breadcrumbs aria-label="Path">
      {["root", ...breadcrumbs].map((name, index) => {
        const key = `${index}-${name}`;
        if (index === breadcrumbs.length) {
          return <Typography key={key}>{name}</Typography>;
        }
        const target = breadcrumbs.slice(0, index);
        return (
          <NextLink
            color="inherit"
            component="a"
            href={projectLinks.files(projectId, { path: filesystemPathOf(target) }) as never}
            key={key}
            sx={{ textTransform: "none" }}
          >
            {name}
          </NextLink>
        );
      })}
    </Breadcrumbs>
  );
};

const FilesTable = ({
  facts,
  localNotFound,
  path,
  projectId,
}: {
  facts: ProjectFacts;
  localNotFound: boolean;
  path: string;
  projectId: string;
}) => {
  const files = useProjectFiles(projectId, path);
  // A listing that could not be established — stale or cleared — cannot establish that anything in
  // it is safe to change, so the same capability governs the toolbar, the drop target, and every
  // row action alike.
  const capability = evaluateProjectFileMutationCapability({ ...facts, content: files.content });
  const reason = capabilityReason(capability);
  const directories = existingDirectoryNames(files.rows);
  const unitId = facts.unit.id;

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: ({ getValue, row: { original: row } }) =>
          isDirectoryRow(row) ? (
            <NextLink
              color="inherit"
              component="a"
              href={
                projectLinks.files(projectId, {
                  path: childFilesystemPath(path, row.name),
                }) as never
              }
              sx={{ textTransform: "none" }}
            >
              {getValue()}
            </NextLink>
          ) : (
            <ViewFilePopover fileName={row.name} path={path} projectId={projectId} />
          ),
        header: "File Name",
      }),
      columnHelper.accessor((row) => (isDirectoryRow(row) ? "-" : row.data.owner), {
        header: "Owner",
        id: "owner",
      }),
      columnHelper.accessor((row) => (isDirectoryRow(row) ? "-" : fileRowMode(row)), {
        header: "Mode",
        id: "mode",
      }),
      columnHelper.accessor((row) => (isDirectoryRow(row) ? "-" : row.data.stat.size), {
        cell: ({ getValue }) => {
          const value = getValue();
          return typeof value === "string" ? value : filesize(value);
        },
        header: "File size",
        id: "fileSize",
      }),
      columnHelper.accessor((row) => (isDirectoryRow(row) ? "-" : row.data.stat.modified), {
        cell: ({ getValue, row }) =>
          isDirectoryRow(row.original) ? getValue() : toLocalTimeString(getValue(), true, true),
        header: "Last updated",
        id: "lastUpdated",
      }),
      columnHelper.display({
        cell: ({ row }) => (
          <ProjectFileActions
            capability={capability}
            path={path}
            projectId={projectId}
            row={row.original}
            unitId={unitId}
          />
        ),
        enableGrouping: false,
        header: "Actions",
        id: "actions",
      }),
    ],
    [capability, path, projectId, unitId],
  );

  return (
    <ProjectFileUpload capability={capability} path={path} projectId={projectId}>
      {(openUploadDialog) => (
        <>
          <SectionReadAlerts
            report={files.report}
            retryableMessage="This directory could not be refreshed. It may be out of date, so nothing in it can be changed until it loads again."
            unavailableMessage="This directory is unavailable or you no longer have access to it."
            onRetry={() => files.retry()}
          />
          {localNotFound ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This file was not found in this project.
            </Alert>
          ) : null}
          {reason ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              {reason}
            </Alert>
          ) : null}

          <Box
            sx={{
              "& .MuiPaper-root:last-child": {
                height: "calc(100vh - 260px)",
                "@supports (height: 100dvh)": { height: "calc(100dvh - 260px)" },
              },
            }}
          >
            <DataTable
              subRowsEnabled
              columns={columns}
              data={files.isLoading ? undefined : files.rows}
              getRowId={(row) => row.fullPath}
              isLoading={files.isLoading}
              toolbarContent={
                <Grid container sx={{ width: "100%" }}>
                  <Grid sx={{ alignItems: "center", display: "flex" }}>
                    <PathBreadcrumbs path={path} projectId={projectId} />
                  </Grid>
                  <Grid sx={{ marginLeft: "auto" }}>
                    <UploadFileControl
                      capability={capability}
                      openUploadDialog={openUploadDialog}
                    />
                    <CreateDirectoryControl
                      capability={capability}
                      existing={directories}
                      path={path}
                      projectId={projectId}
                    />
                    <Tooltip title="Refresh this directory">
                      <IconButton size="large" onClick={() => files.refresh()}>
                        <RefreshRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              }
            />
          </Box>
        </>
      )}
    </ProjectFileUpload>
  );
};

const FilesSection = ({
  localNotFound = false,
  route,
}: {
  localNotFound?: boolean;
  route: FilesRoute;
}) => {
  const { projectId } = route;
  const path = route.path ?? filesystemRoot;
  const facts = useProjectFacts();

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography gutterBottom component="h1" variant="h4">
          Files
        </Typography>
        {facts === undefined ? (
          <CenterLoader />
        ) : (
          /* A new project or a new directory is a new listing, so nothing the previous one was
          showing — rows, dialogs, or an in-flight command's control state — survives into it. */
          <FilesTable
            facts={facts}
            key={`${projectId}:${path}`}
            localNotFound={localNotFound}
            path={path}
            projectId={projectId}
          />
        )}
      </Container>
    </Layout>
  );
};

/**
 * The Files section of the project in the URL. Every directory it reads, every row it displays,
 * every link it builds, and every change it sends belongs to that project and to the path this
 * section itself owns: no read, link, capability, or mutation here consults a selected or
 * previously current project, and no other section is given the path.
 */
export const ProjectFiles = () => {
  const section = resolveProjectSectionRoute(useFamilyRoute(), isFilesRoute);

  switch (section.kind) {
    case "not-found":
      return <NextError statusCode={404} />;
    // A file route the section could not address keeps the project and its root listing rather
    // than guessing a correction for it.
    case "local-not-found":
      return <FilesSection localNotFound route={{ kind: "files", projectId: section.projectId }} />;
    case "route":
      return <FilesSection route={section.route} />;
  }
};
