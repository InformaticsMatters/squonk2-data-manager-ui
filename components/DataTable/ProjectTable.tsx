import React, { FC, memo } from 'react';

import { Typography } from '@material-ui/core';
import { ProjectFileDetail, ProjectSummary, useGetProject } from '@squonk/data-manager-client';

import { DataTable } from './DataTable';
import { addFullPaths, nestRows } from './file-nesting';
import { Row } from './types';

export const ProjectTable: FC<{ currentProject: ProjectSummary }> = memo(({ currentProject }) => {
  const { data: project, isLoading } = useGetProject(currentProject.project_id as string);

  if (!isLoading && project) {
    const rows: Row[] = project.files.map((file) => {
      // TODO: Open API spec has a typo. Fixed but need to rebuild th client.
      const { file_id, file_name, file_path, owner, immutable } = file as ProjectFileDetail & {
        immutable?: boolean;
      };
      return {
        id: file_id,
        fileName: file_name,
        path: file_path,
        owner,
        actions: { projectId: project.project_id },
        fullPath: '',
        immutable,
      };
    });

    const nestedRows = addFullPaths('', nestRows(rows));
    return (
      <>
        <Typography variant="h4" component="h1">
          Project: {currentProject.name}
        </Typography>
        <DataTable rows={nestedRows} />
      </>
    );
  }
  return <div>Project Datasets Loading...</div>;
});
