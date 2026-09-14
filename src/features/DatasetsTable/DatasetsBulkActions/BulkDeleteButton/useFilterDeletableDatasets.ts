import { evaluateDatasetDeletionCapability } from "../../../../datasets/capabilities";
import { useKeycloakUser } from "../../../../hooks/useKeycloakUser";
import { type TableDatasetSubRow } from "../..";

/**
 * Splits selected dataset into deletable and undeletable datasets based on user's permission.
 */
export const useFilterDeletableDatasets = (datasets: TableDatasetSubRow[]) => {
  const { user } = useKeycloakUser();

  const deletableDatasets: TableDatasetSubRow[] = [];
  const undeletableDatasets: TableDatasetSubRow[] = [];

  datasets.forEach((dataset) => {
    const capability = evaluateDatasetDeletionCapability({
      caller: { username: user.username },
      dataset: dataset.datasetSummary,
      version: dataset.datasetVersion,
    });
    if (capability.status === "enabled") {
      deletableDatasets.push(dataset);
    } else {
      undeletableDatasets.push(dataset);
    }
  });

  return { deletableDatasets, undeletableDatasets };
};
