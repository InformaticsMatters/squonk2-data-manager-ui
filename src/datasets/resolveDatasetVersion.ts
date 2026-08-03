import { type DatasetSummary, type DatasetVersionSummary } from "@/api/data-manager";

export type DatasetVersionResolution =
  | { kind: "dataset-not-found" }
  | { kind: "resolved"; dataset: DatasetSummary; version: DatasetVersionSummary }
  | { kind: "version-not-found"; dataset: DatasetSummary };

export const resolveDatasetVersion = (
  datasets: readonly DatasetSummary[],
  datasetId: string,
  requestedVersion?: number,
): DatasetVersionResolution => {
  const dataset = datasets.find(({ dataset_id }) => dataset_id === datasetId);
  if (!dataset) {
    return { kind: "dataset-not-found" };
  }

  const version =
    requestedVersion === undefined
      ? dataset.versions.reduce<DatasetVersionSummary | undefined>(
          (latest, candidate) =>
            !latest || candidate.version > latest.version ? candidate : latest,
          undefined,
        )
      : dataset.versions.find(({ version }) => version === requestedVersion);
  return version ? { kind: "resolved", dataset, version } : { kind: "version-not-found", dataset };
};
