import { FC, memo } from 'react';

import { ProjectSummary, useGetProject } from '@squonk/data-manager-client';

import { DataTable } from './DataTable';
import { addFullPaths, nestRows } from './file-nesting';

export const ProjectTable: FC<{ currentProject: ProjectSummary }> = memo(({ currentProject }) => {
  const { data: project, isLoading } = useGetProject(currentProject.project_id as string);

  if (!isLoading && project) {
    const rows = project.files.map(({ file_id, file_name, file_path, owner }) => ({
      id: file_id,
      fileName: file_name,
      path: file_path,
      owner,
      actions: { projectId: project.project_id },
      fullPath: '',
    }));
    const nestedRows = addFullPaths('', nestRows(rows));
    console.log(nestedRows);
    return <DataTable rows={nestedRows} />;
  }
  return <div>Project Datasets Loading...</div>;
});
