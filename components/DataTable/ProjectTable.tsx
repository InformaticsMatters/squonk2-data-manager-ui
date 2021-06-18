import React, { FC, memo, useEffect, useState } from 'react';

import { Breadcrumbs, Link, Typography } from '@material-ui/core';
import { ProjectSummary, useGetFile } from '@squonk/data-manager-client';

import { DataTable } from './DataTable';
import { Row, TableRow } from './types';

export const ProjectTable: FC<{ currentProject: ProjectSummary }> = memo(({ currentProject }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  useEffect(() => {
    setBreadcrumbs([]);
  }, [currentProject.project_id]);

  const path = '/' + breadcrumbs.join('/');

  const { data } = useGetFile({ project_id: currentProject.project_id, path });

  if (data) {
    const files: Row[] = data.files.map((file) => {
      const { file_id, file_name, owner, immutable, paths } = file;
      return {
        id: file_id,
        fileName: file_name,
        owner,
        actions: { projectId: currentProject.project_id },
        fullPath: breadcrumbs.join('/') + '/' + file_name,
        immutable: immutable as unknown as boolean,
        path: '',
      };
    });

    const dirs: Row[] = data.paths.map((path) => ({
      fileName: path,
      path: path,
      fullPath: path,
      actions: {
        projectId: currentProject.project_id,
        changePath: () => setBreadcrumbs([...breadcrumbs, path]),
      },
    }));

    const rows = [...dirs, ...files].map((row) => {
      (row as TableRow).items = [];
      return row;
    });

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
        <DataTable rows={rows} />
      </>
    );
  }
  return <div>Project Datasets Loading...</div>;
});
