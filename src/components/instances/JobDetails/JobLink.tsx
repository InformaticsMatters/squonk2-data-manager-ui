import { Folder } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import A from "next/link";

import { filesystemPathOf } from "../../../projects/fileFacts";
import { ProjectFileViewerLinks } from "../../../projects/ProjectFileViewerLinks";
import { projectLinks } from "../../../projects/routes";

export interface JobLinkProps {
  projectId: string;
  path: string;
  isFile?: boolean;
}

/**
 * Processes provided path. Returns the path in the form of an array of path parts where '.' or
 * double '/' are not present.
 */
const getPath = (contains: string) =>
  contains
    .split("/")
    .filter((part) => part !== ".")
    // Filter empty parts
    .filter((part) => !!part);

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

  return { containsGlob, resolvedPath };
};

/**
 * Creates a link to a task's input or output depending on the type and path. The link always
 * addresses the project that owns the execution, and carries nothing but the path Files owns, so
 * locating a file cannot change which project is displayed or copy unrelated query state into it.
 */
export const JobLink = ({ projectId, path: originalPath, isFile }: JobLinkProps) => {
  const path = getPath(originalPath);
  const { containsGlob, resolvedPath } = getResolvedPath(path);
  const displayPath = path.join("/");

  if (isFile && !containsGlob) {
    const fileName = resolvedPath.at(-1) as string;
    const filePath = filesystemPathOf(resolvedPath.slice(0, -1));

    return (
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, wordBreak: "break-all" }}>
        <Tooltip title="Locate file in project">
          <IconButton
            component={A}
            href={projectLinks.files(projectId, { path: filePath }) as never}
            size="large"
          >
            <Folder color="primary" fontSize="small" />
          </IconButton>
        </Tooltip>

        <ProjectFileViewerLinks directory={filePath} fileName={fileName} projectId={projectId} />
      </Box>
    );
  }

  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
      <Tooltip title="Show directory in project">
        <IconButton
          component={A}
          href={projectLinks.files(projectId, { path: filesystemPathOf(resolvedPath) }) as never}
          size="small"
        >
          <Folder color="primary" fontSize="small" />
        </IconButton>
      </Tooltip>

      <Typography component="span">{displayPath}</Typography>
    </Box>
  );
};
