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
 * Splits path, provided as string, into path parts and potentially removing leading '.' and
 * stopping on encountering first glob.
 */
const getPath = (contains: string) => {
  let containsGlob = false;

  const path = contains
    .split('/')
    // If the path begins with a '.', remove it
    .filter((part, i) => !(i === 0 && part === '.'))
    // Stop at first glob
    .filter((part) => {
      if (part.includes('*')) {
        containsGlob = true;
      }

      return !containsGlob;
    });

  return {
    path,
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

  const { path, containsGlob } = getPath(creates);

  if (type === 'file' && !containsGlob) {
    const { filePath, fileName } = getFilePathAndName(path);

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
              <Typography component="span">{creates}</Typography>
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
            path,
          },
        }}
      >
        <Tooltip title="Show directory in project">
          <IconButton size="small">
            <Folder color="primary" fontSize="small" />
          </IconButton>
        </Tooltip>
      </NextLink>

      <Typography component="span">{creates}</Typography>
    </Box>
  );
};
