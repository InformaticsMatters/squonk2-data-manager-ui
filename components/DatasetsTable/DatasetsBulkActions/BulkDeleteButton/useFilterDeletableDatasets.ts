import { useKeycloakUser } from '../../../../hooks/useKeycloakUser';
import type { TableDataset } from '../..';

/**
 * Splits selected dataset into deletable and undeletable datasets based on user's permission.
 */
export const useFilterDeletableDatasets = (datasets: TableDataset[]) => {
  const { user } = useKeycloakUser();

  const deletableDatasets: TableDataset[] = [];
  const undeletableDatasets: TableDataset[] = [];

  datasets.forEach((dataset) => {
    const isEditor = !!user.username && dataset.editors.includes(user.username);
    const isOwner = dataset.owner === user.username;

    if (isEditor || isOwner) {
      deletableDatasets.push(dataset);
    } else {
      undeletableDatasets.push(dataset);
    }
  });

  return { deletableDatasets, undeletableDatasets };
};
