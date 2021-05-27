import { ProjectSummary } from '@squonk/data-manager-client';

import { AllDatasetsTable } from './AllDatasetsTable';
import { ProjectTable } from './ProjectTable';

interface DataTableManagerProps {
  currentProject: ProjectSummary | null;
}
export const DataTableManager: React.FC<DataTableManagerProps> = ({ currentProject }) => {
  if (currentProject === null) {
    return <AllDatasetsTable />;
  } else {
    return <ProjectTable currentProject={currentProject} />;
  }
};
