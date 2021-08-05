import React, { useState } from 'react';

import { useGetFiles } from '@squonk/data-manager-client/file';

import { css } from '@emotion/react';
import { Breadcrumbs, Link, Typography } from '@material-ui/core';

import { CenterLoader } from '../../CenterLoader';
import { FileListItem } from './FileListItem';
import { ScrollList } from './ScrollList';
import type { FileOrDirectory, SharedProps } from './types';
import { getChecked, getFullPath, getNewValue } from './utils';

export const AllFilesList = ({
  projectId,
  value,
  targetType,
  onSelect,
  multiple,
  mimeTypes,
}: SharedProps) => {
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const subPath = '/' + breadcrumbs.join('/');

  const { data, isLoading } = useGetFiles({
    project_id: projectId,
    path: subPath,
  });

  const files = data?.files.filter(
    (file) => !(!file.mime_type || mimeTypes?.includes(file.mime_type)),
  );
  const dirs = data?.paths;

  const handleSelect = (fullPath: string) => (checked: boolean) =>
    onSelect(getNewValue(fullPath, checked, multiple, value));

  const items = [
    ...(dirs ?? []).map((path) => {
      const fullPath = getFullPath(breadcrumbs, path);
      const type: FileOrDirectory = 'directory';
      return {
        fullPath: path,
        key: fullPath,
        mimeType: undefined,
        title: path,
        type,
        onClick: () => setBreadcrumbs([...breadcrumbs, path]),
        onSelect: targetType.startsWith('dir') ? handleSelect(fullPath) : undefined,
      };
    }),
    ...(files ?? []).map((file) => {
      const fullPath = getFullPath(breadcrumbs, file.file_name);
      const type: FileOrDirectory = 'file';
      return {
        fullPath,
        mimeType: file.mime_type,
        title: file.file_name,
        type,
        onSelect: handleSelect(fullPath),
      };
    }),
  ];

  return (
    <>
      <Breadcrumbs>
        {['root', ...breadcrumbs].map((path, pathIndex) =>
          pathIndex < breadcrumbs.length ? (
            <Link
              color="inherit"
              component="button"
              key={`${pathIndex}-${path}`}
              variant="body1"
              onClick={() => setBreadcrumbs(breadcrumbs.slice(0, pathIndex))}
            >
              {path}
            </Link>
          ) : (
            <Typography key={`${pathIndex}-${path}`}>{path}</Typography>
          ),
        )}
      </Breadcrumbs>
      {!isLoading ? (
        items.length === 0 ? (
          <Typography
            css={css`
              text-align: center;
            `}
            variant="body2"
          >
            No files or directories
          </Typography>
        ) : (
          <ScrollList dense>
            {items
              .filter((item) => (targetType.startsWith('dir') ? item.type === 'directory' : true))
              .map((item) => (
                <FileListItem
                  key={item.fullPath}
                  {...item}
                  checked={getChecked(value, item.fullPath)}
                  projectId={projectId}
                />
              ))}
          </ScrollList>
        )
      ) : (
        <CenterLoader />
      )}
    </>
  );
};
