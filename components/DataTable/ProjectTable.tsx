import { ProjectDetail, ProjectSummary, useGetProject } from '@squonk/data-manager-client';

import { DataTable } from './DataTable';
import { nestRows } from './file-nesting';
import { Row } from './types';

export const ProjectTable: React.FC<{ currentProject: ProjectSummary }> = ({ currentProject }) => {
  const { data, isLoading } = useGetProject(currentProject.project_id as string);
  const project = data as ProjectDetail | undefined;

  if (!isLoading) {
    const rows = (project as ProjectDetail).files?.map(
      ({ file_id, file_name, file_path, owner }) => ({
        id: file_id,
        fileName: file_name,
        path: file_path,
        owner,
        actions: { projectId: project?.project_id },
      }),
    );
    if (rows) {
      return <DataTable rows={nestRows(rows as Row[])} />;
    }
  }
  return <div>Project Datasets Loading...</div>;
};
