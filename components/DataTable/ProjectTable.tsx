import React, { FC, memo, useEffect, useState } from 'react';

import { Breadcrumbs, Link, Typography } from '@material-ui/core';
import { ProjectSummary } from '@squonk/data-manager-client';
import { useGetFiles } from '@squonk/data-manager-client/file';

import { DataTable } from './DataTable';
import { Row, TableDir, TableFile } from './types';

export const ProjectTable: FC<{ currentProject: ProjectSummary }> = memo(({ currentProject }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  useEffect(() => {
    setBreadcrumbs([]);
  }, [currentProject.project_id]);

  const dirPath = '/' + breadcrumbs.join('/'); // TODO: This shouldn't need a leading slash

  const { data } = useGetFiles({ project_id: currentProject.project_id, path: dirPath });

  if (data) {
    const files: TableFile[] = data.files.map((file) => {
      const { file_id, file_name, owner, immutable } = file;

      let fullPath: string;
      if (breadcrumbs.length > 0) {
        fullPath = breadcrumbs.join('/') + '/' + file_name;
      } else {
        fullPath = file_name;
      }

      return {
        fileName: file_name,
        fullPath,
        id: file_id,
        owner,
        immutable: immutable as unknown as boolean,
        actions: { projectId: currentProject.project_id },
      };
    });

    const dirs: TableDir[] = data.paths.map((path) => {
      let fullPath: string;
      if (breadcrumbs.length > 0) {
        fullPath = breadcrumbs.join('/') + '/' + path;
      } else {
        fullPath = path;
      }

      return {
        fileName: path,
        fullPath,
        path,
        actions: {
          changePath: () => setBreadcrumbs([...breadcrumbs, path]),
        },
      };
    });

    const rows: Row[] = [...dirs, ...files];

    return (
      <>
        <Typography variant="h4" component="h1">
          Project: {currentProject.name}
        </Typography>
        <Breadcrumbs>
          {['root', ...breadcrumbs].map((path, pathIndex) =>
            pathIndex < breadcrumbs.length ? (
              <Link
                variant="body1"
                key={`${pathIndex}-${path}`}
                color="inherit"
                component="button"
                onClick={() => setBreadcrumbs(breadcrumbs.slice(0, pathIndex))}
              >
                {path}
              </Link>
            ) : (
              <Typography key={`${pathIndex}-${path}`}>{path}</Typography>
            ),
          )}
        </Breadcrumbs>
        <DataTable
          rows={rows}
          columns={[
            { name: 'fileName', title: 'File Name' },
            { name: 'owner', title: 'Owner' },
            { name: 'mode', title: 'Mode' },
            { name: 'actions', title: 'Actions' },
            // { name: 'fullPath', title: 'Full Path' },
          ]}
        />
      </>
    );
  }
  return <div>Project Datasets Loading...</div>;
});
