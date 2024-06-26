import { type TableDatasetSubRow } from "../..";

/**
 * Sorts undeletable dataset versions in ascending order and groups them by dataset ID. This isn't
 * theoretically the fastest possible way to sort the versions, but from a potential use case it
 * should be sufficient. For couple of hand-picked versions any sorting would suffice. In case of a
 * large number of datasets being selected, we could bet on the selection being created by toggling
 * selection of all rows, in which case the dataset versions are inserted in the order the API
 * provided, which should already be sorted.
 */
export const useSortUndeletableDatasets = (undeletableDatasets: TableDatasetSubRow[]) => {
  // Dataset versions are grouped by dataset ID.
  const sortedDatasetsMap = new Map<string, TableDatasetSubRow[]>();

  // Group the dataset versions
  undeletableDatasets.forEach((dataset) => {
    let datasetsArray = sortedDatasetsMap.get(dataset.dataset_id);
    if (!datasetsArray) {
      datasetsArray = [];
      sortedDatasetsMap.set(dataset.dataset_id, datasetsArray);
    }

    datasetsArray.push(dataset);
  });

  // Transform the map into an array of dataset groups and sort them
  const sortedArray = [...sortedDatasetsMap.values()].map((datasetArray) => {
    return datasetArray.sort((a, b) => a.version - b.version);
  });

  return sortedArray;
};
