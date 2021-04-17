import { ProjectSummary } from '@squonk/data-manager-client';

import { OrphansTable } from './OrphansTable';
import { ProjectTable } from './ProjectTable';

interface DataTableManagerProps {
  currentProject: ProjectSummary | null;
}
export const DataTableManager: React.FC<DataTableManagerProps> = ({ currentProject }) => {
  if (currentProject === null) {
    return <OrphansTable />;
  } else {
    return <ProjectTable currentProject={currentProject} />;
  }
};
