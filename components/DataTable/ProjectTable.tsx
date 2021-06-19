import React, { FC, memo, useEffect, useState } from 'react';

import { Breadcrumbs, Link, Typography } from '@material-ui/core';
import { ProjectSummary, useGetFile } from '@squonk/data-manager-client';

import { DataTable } from './DataTable';
import { Row, TableDir, TableFile } from './types';

export const ProjectTable: FC<{ currentProject: ProjectSummary }> = memo(({ currentProject }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  useEffect(() => {
    setBreadcrumbs([]);
  }, [currentProject.project_id]);

  const path = '/' + breadcrumbs.join('/');

  const { data } = useGetFile({ project_id: currentProject.project_id, path });

  if (data) {
    const files: TableFile[] = data.files.map((file) => {
      const { file_id, file_name, owner, immutable } = file;
      return {
        fileName: file_name,
        fullPath: breadcrumbs.join('/') + '/' + file_name,
        id: file_id,
        owner,
        immutable: immutable as unknown as boolean,
        actions: { projectId: currentProject.project_id },
      };
    });

    const dirs: TableDir[] = data.paths.map((path) => ({
      fileName: path,
      fullPath: path,
      path: path,
      actions: {
        changePath: () => setBreadcrumbs([...breadcrumbs, path]),
      },
    }));

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
        <DataTable rows={rows} />
      </>
    );
  }
  return <div>Project Datasets Loading...</div>;
});
