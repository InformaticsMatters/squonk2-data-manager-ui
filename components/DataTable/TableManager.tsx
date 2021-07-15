import { FC } from 'react';

import { useCurrentProject } from '../state/currentProjectHooks';
import { AllDatasetsTable } from './DatasetsTable';
import { ProjectTable } from './ProjectTable';

export const DataTableManager: FC = () => {
  const currentProject = useCurrentProject();

  if (currentProject === null) {
    return <AllDatasetsTable />;
  } else {
    return <ProjectTable currentProject={currentProject} />;
  }
};
