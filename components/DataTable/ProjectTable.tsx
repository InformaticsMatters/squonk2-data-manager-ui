import { ProjectDetail, ProjectSummary, useGetProject } from '@squonk/data-manager-client';

import DataTable from './DataTable';

export const ProjectTable: React.FC<{ currentProject: ProjectSummary }> = ({ currentProject }) => {
  const { data, isLoading } = useGetProject(currentProject.project_id as string);
  const project = data as ProjectDetail;

  if (!isLoading) {
    const files = (project.files as any) as { name: string; path: string }[];

    return <DataTable files={files} />;
  }
  return <div>Project Datasets Loading...</div>;
};
