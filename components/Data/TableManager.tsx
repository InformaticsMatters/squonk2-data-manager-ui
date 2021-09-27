import { useCurrentProject } from '../../hooks/currentProjectHooks';
import { DatasetsTable } from '../DatasetsTable';
import { ProjectTable } from '../ProjectTable';

/**
 * Switches between the datasets table or the project table depending on the selected project state
 */
export const DataTableManager = () => {
  const currentProject = useCurrentProject();

  // Despite the same table component in use by each table, we can't just update props of a single
  // table component as different hooks are used and this would cause a react-hook warning.
  if (currentProject === null) {
    return <DatasetsTable />;
  }
  return <ProjectTable currentProject={currentProject} />;
};
