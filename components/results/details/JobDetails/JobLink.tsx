import { Folder } from '@mui/icons-material';
import { Box, IconButton, Link, Tooltip, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { APP_ROUTES } from '../../../../constants/routes';

export interface JobLinkProps {
  projectId: string;
  path: string;
  type?: 'file' | 'files' | 'directory';
}

/**
 * Processes provided path. Returns the path in the form of an array of path parts where '.' or
 * double '/' are not present.
 */
const getPath = (contains: string) => {
  const path = contains
    .split('/')
    .filter((part) => part !== '.')
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
  const filePath = path.slice(0, path.length - 1);
  const fileName = path[path.length - 1];
  return { filePath, fileName };
};

/**
 * Creates a link to a task's input or output depending on the type and path.
 */
export const JobLink = ({ projectId, path: originalPath, type }: JobLinkProps) => {
  const { query } = useRouter();

  const path = getPath(originalPath);
  const { resolvedPath, containsGlob } = getResolvedPath(path);
  const displayPath = path.join('/');

  if (type === 'file' && !containsGlob) {
    const { filePath, fileName } = getFilePathAndName(resolvedPath);

    return (
      <Box
        alignItems="center"
        display="flex"
        gap={(theme) => theme.spacing(1)}
        sx={{ wordBreak: 'break-all' }}
      >
        <NextLink
          passHref
          href={{
            pathname: APP_ROUTES.project['.'],
            query: {
              ...query,
              project: projectId,
              path: filePath,
            },
          }}
        >
          <Tooltip title="Locate file in project">
            <IconButton size="large">
              <Folder color="primary" fontSize="small" />
            </IconButton>
          </Tooltip>
        </NextLink>

        <NextLink
          passHref
          href={{
            pathname: APP_ROUTES.project.file,
            query: {
              project: projectId,
              path: filePath,
              file: fileName,
            },
          }}
        >
          <Tooltip title="Open in Plaintext Viewer">
            <Link color="textSecondary" rel="noopener noreferrer" target="_blank">
              <Typography component="span">{displayPath}</Typography>
            </Link>
          </Tooltip>
        </NextLink>
      </Box>
    );
  }

  return (
    <Box alignItems="center" display="flex" gap={(theme) => theme.spacing(1)}>
      <NextLink
        passHref
        href={{
          pathname: APP_ROUTES.dataset['.'],
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
