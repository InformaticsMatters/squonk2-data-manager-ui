import { Folder } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import A from "next/link";
import { useRouter } from "next/router";

import { ViewFilePopover } from "../../ViewFilePopover/ViewFilePopover";

export interface JobLinkProps {
  projectId: string;
  path: string;
  isFile?: boolean;
}

/**
 * Processes provided path. Returns the path in the form of an array of path parts where '.' or
 * double '/' are not present.
 */
const getPath = (contains: string) => {
  const path = contains
    .split("/")
    .filter((part) => part !== ".")
    // Filter empty parts
    .filter((part) => !!part);

  return path;
};

/**
 * Returns a resolved path, which points to the last directory before a glob path part was
 * encountered, in the same form and a boolean value whether such path part was encountered.
 */
const getResolvedPath = (path: string[]) => {
  let containsGlob = false;

  const resolvedPath = path.filter((part) => {
    if (part.includes("*")) {
      containsGlob = true;
    }

    return !containsGlob;
  });

  return {
    resolvedPath,
    containsGlob,
  };
};

/**
 * Gets the file name and the path to the file from provided path.
 */
const getFilePathAndName = (path: string[]) => {
  const filePath = path.slice(0, -1);
  const fileName = path.at(-1) as string;
  return { filePath, fileName };
};

/**
 * Creates a link to a task's input or output depending on the type and path.
 */
export const JobLink = ({ projectId, path: originalPath, isFile }: JobLinkProps) => {
  const { query } = useRouter();
  const path = getPath(originalPath);
  const { resolvedPath, containsGlob } = getResolvedPath(path);
  const displayPath = path.join("/");

  if (isFile && !containsGlob) {
    const { filePath, fileName } = getFilePathAndName(resolvedPath);

    return (
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          gap: (theme) => theme.spacing(1),
          wordBreak: "break-all",
        }}
      >
        <Tooltip title="Locate file in project">
          <A
            legacyBehavior
            passHref
            href={{
              pathname: "/project",
              query: {
                ...query,
                project: projectId,
                path: filePath,
              },
            }}
          >
            <IconButton size="large">
              <Folder color="primary" fontSize="small" />
            </IconButton>
          </A>
        </Tooltip>

        <ViewFilePopover fileName={fileName} path={filePath.join("/")} />
      </Box>
    );
  }

  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: (theme) => theme.spacing(1) }}>
      <Tooltip title="Show directory in project">
        <A
          legacyBehavior
          passHref
          href={{
            pathname: "/datasets",
            query: {
              ...query,
              project: projectId,
              path: resolvedPath,
            },
          }}
        >
          <IconButton size="small">
            <Folder color="primary" fontSize="small" />
          </IconButton>
        </A>
      </Tooltip>

      <Typography component="span">{displayPath}</Typography>
    </Box>
  );
};
