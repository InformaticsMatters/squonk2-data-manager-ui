import { useGetDatasets } from "@/api/data-manager/dataset";

import { resolveDatasetVersion } from "./resolveDatasetVersion";

export const useDatasetVersionResolution = (datasetId: string, requestedVersion?: number) => {
  const query = useGetDatasets();
  return {
    ...query,
    resolution: query.data
      ? resolveDatasetVersion(query.data.datasets, datasetId, requestedVersion)
      : undefined,
  };
};
