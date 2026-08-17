import { type DatasetSummary, type DatasetVersionSummary } from "@/api/data-manager";

/**
 * Which version of a dataset is its latest: the highest version number the Data Manager listed,
 * whatever order it listed them in. This is the family's one rule, so the version a dataset-only
 * route canonicalises to, the version a deletion falls back to, the version a detail displays as
 * current, and the version a new upload is a successor of can never be different versions.
 */
export const latestDatasetVersion = (
  versions: readonly DatasetVersionSummary[],
): DatasetVersionSummary | undefined =>
  versions.reduce<DatasetVersionSummary | undefined>(
    (latest, candidate) => (!latest || candidate.version > latest.version ? candidate : latest),
    undefined,
  );

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
      ? latestDatasetVersion(dataset.versions)
      : dataset.versions.find(({ version }) => version === requestedVersion);
  return version ? { kind: "resolved", dataset, version } : { kind: "version-not-found", dataset };
};
