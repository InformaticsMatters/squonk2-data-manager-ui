import { getGetVersionsSuspenseQueryOptions } from "@/api/data-manager/dataset";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import { useSettledQuery } from "../hooks/useSettledQuery";
import { resolveDatasetVersion } from "./resolveDatasetVersion";

/**
 * Resolves one dataset version from that dataset's own read, suspending until it has answered. A
 * dataset the Data Manager does not have, or will not show this caller, is not found rather than a
 * failure to retry.
 */
export const useDatasetVersionResolution = (datasetId: string, requestedVersion?: number) => {
  const { data, error, isFetching, refetch } = useSettledQuery(
    getGetVersionsSuspenseQueryOptions(datasetId),
  );
  const kind = error ? classifyTransportFailure(error).kind : undefined;
  const missing = kind === "not-found" || kind === "forbidden";

  return {
    error: missing ? null : error,
    isFetching,
    refetch,
    resolution: data
      ? resolveDatasetVersion([data], datasetId, requestedVersion)
      : ({ kind: "dataset-not-found" } as const),
  };
};
