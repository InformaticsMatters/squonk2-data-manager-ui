import { Link } from '@material-ui/core';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import type { OutputValue } from './types';

export interface JobOutputLinkProps {
  projectId: string;
  output: OutputValue;
}

const getPath = (contains: string) => {
  let containsGlob = false;

  const path = contains.split('/').filter((part) => {
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

  const { path, containsGlob } = getPath(creates);

  if (type === 'file' && !containsGlob) {
    const { filePath, fileName } = getFilePathAndName(path);

    return (
      <>
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
          <Link>🗀{Boolean(filePath.length) && `/${filePath}`}</Link>
        </NextLink>
        /
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
          <Link rel="noopener noreferrer" target="_blank">
            {fileName}
          </Link>
        </NextLink>
      </>
    );
  }
  return (
    <>
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
        <Link>🗀</Link>
      </NextLink>
      /{creates}
    </>
  );
};
