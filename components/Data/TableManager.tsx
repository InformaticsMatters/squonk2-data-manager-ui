import type { FC } from 'react';

import { useCurrentProject } from '../../hooks/currentProjectHooks';
import { AllDatasetsTable } from '../DatasetsTable';
import { ProjectTable } from '../ProjectTable';

export const DataTableManager: FC = () => {
  const currentProject = useCurrentProject();

  if (currentProject === null) {
    return <AllDatasetsTable />;
  }
  return <ProjectTable currentProject={currentProject} />;
};
