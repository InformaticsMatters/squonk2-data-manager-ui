import React, { useState } from 'react';

import { useGetFiles } from '@squonk/data-manager-client/file';

import { Breadcrumbs, Link, Typography } from '@material-ui/core';

import { FileListItem } from './FileListItem';
import { ScrollList } from './ScrollList';
import type { SharedProps } from './types';
import { getChecked, getNewValue } from './utils';

export const AllFilesList = ({
  projectId,
  value,
  targetType,
  onSelect,
  multiple,
  mimeTypes,
}: SharedProps) => {
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const path = '/' + breadcrumbs.join('/');

  const { data, isLoading } = useGetFiles({
    project_id: projectId,
    path,
  });

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
      <ScrollList dense>
        {data?.paths.map((path) => {
          const fullPath = breadcrumbs.join('/') + (breadcrumbs.length ? '/' : '') + path;
          return (
            <FileListItem
              checked={getChecked(value, fullPath)}
              fullPath={path}
              key={fullPath}
              mimeType={undefined}
              projectId={projectId}
              title={path}
              type="directory"
              onClick={() => setBreadcrumbs([...breadcrumbs, path])}
              onSelect={
                targetType.startsWith('dir')
                  ? (checked) => onSelect(getNewValue(fullPath, checked, multiple, value))
                  : undefined
              }
            />
          );
        })}
        {!targetType.startsWith('dir') &&
          data?.files
            .filter((file) => !(!file.mime_type || mimeTypes.includes(file.mime_type)))
            .map((file) => {
              const fullPath =
                breadcrumbs.join('/') + (breadcrumbs.length ? '/' : '') + file.file_name;
              return (
                <FileListItem
                  checked={getChecked(value, fullPath)}
                  fullPath={fullPath}
                  key={fullPath}
                  mimeType={file.mime_type}
                  projectId={projectId}
                  title={file.file_name}
                  type="file"
                  onSelect={(checked) => onSelect(getNewValue(fullPath, checked, multiple, value))}
                />
              );
            })}
      </ScrollList>
    </>
  );
};
