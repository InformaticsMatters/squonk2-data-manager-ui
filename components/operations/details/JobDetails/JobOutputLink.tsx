import { css } from '@emotion/react';
import { Box, IconButton, Link, Tooltip, Typography, useTheme } from '@material-ui/core';
import { Folder } from '@material-ui/icons';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import type { OutputValue } from './types';

export interface JobOutputLinkProps {
  projectId: string;
  output: OutputValue;
}

/**
 * Processes provided path. Returns the path in the form of an array of path parts where leading '.'
 * or double '/' are not present.
 */
const getPath = (contains: string) => {
  const path = contains
    .split('/')
    // If the path begins with a '.', remove it
    .filter((part, i) => !(i === 0 && part === '.'))
    // Filter empty parts
    .filter((part) => Boolean(part));

  return path;
};

/**
 * Returns a resolved path, which points to the last directory before a glob path part was
 * encountered, in the same form and a boolean value whether such path part was encountered.
 */
const getResolvedPath = (path: string[]) => {
  let containsGlob = false;

  const resolvedPath = path.filter((part) => {
    if (part.includes('*')) {
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
  const filePath = path.slice(0, path.length - 2);
  const fileName = path[path.length - 1];
  return { filePath, fileName };
};

/**
 * Creates a link to a task's output depending on the type and path of the output.
 */
export const JobOutputLink = ({ output, projectId }: JobOutputLinkProps) => {
  const { type, creates } = output;

  const { query } = useRouter();
  const theme = useTheme();

  const path = getPath(creates);
  const { resolvedPath, containsGlob } = getResolvedPath(path);
  const displayPath = path.join('/');

  if (type === 'file' && !containsGlob) {
    const { filePath, fileName } = getFilePathAndName(resolvedPath);

    return (
      <Box
        alignItems="center"
        css={css`
          gap: ${theme.spacing()}px;
        `}
        display="flex"
      >
        <NextLink
          passHref
          href={{
            pathname: '/data',
            query: {
              ...query,
              project: projectId,
              path: filePath,
            },
          }}
        >
          <Tooltip title="Locate file in project">
            <IconButton size="small">
              <Folder color="primary" fontSize="small" />
            </IconButton>
          </Tooltip>
        </NextLink>

        <NextLink
          passHref
          href={{
            pathname: '/project/[projectId]/file',
            query: {
              projectId,
              path: filePath,
              file: fileName,
            },
          }}
        >
          <Tooltip title="Open in Plaintext Viewer">
            <Link rel="noopener noreferrer" target="_blank">
              <Typography component="span">{displayPath}</Typography>
            </Link>
          </Tooltip>
        </NextLink>
      </Box>
    );
  }

  return (
    <Box
      alignItems="center"
      css={css`
        gap: ${theme.spacing()}px;
      `}
      display="flex"
    >
      <NextLink
        passHref
        href={{
          pathname: '/data',
          query: {
            ...query,
            project: projectId,
            path: resolvedPath,
          },
        }}
      >
        <Tooltip title="Show directory in project">
          <IconButton size="small">
            <Folder color="primary" fontSize="small" />
          </IconButton>
        </Tooltip>
      </NextLink>

      <Typography component="span">{displayPath}</Typography>
    </Box>
  );
};
