import { type DatasetSummary } from "@/api/data-manager";

import { expect, test } from "@playwright/test";

import { resolveDatasetVersion } from "../../src/datasets/resolveDatasetVersion";

const dataset = (datasetId: string, versions: number[]): DatasetSummary => ({
  dataset_id: datasetId,
  editors: [],
  versions: versions.map((version) => ({
    file_name: `dataset-v${version}.sdf`,
    owner: "owner@example.org",
    processing_stage: "DONE",
    projects: [],
    published: "2026-01-02T03:04:05Z",
    size: version,
    source_ref: `dataset-v${version}.sdf`,
    type: "chemical/x-mdl-sdfile",
    version,
  })),
});

const datasets = [dataset("dataset-a", [1, 3, 2]), dataset("dataset-b", [4])];

test.describe("Dataset version resolution", () => {
  test("resolves the highest available version for a dataset-only route", () => {
    expect(resolveDatasetVersion(datasets, "dataset-a")).toMatchObject({
      kind: "resolved",
      dataset: { dataset_id: "dataset-a" },
      version: { version: 3 },
    });
  });

  test("resolves an exact explicit version independent of collection order", () => {
    expect(resolveDatasetVersion(datasets, "dataset-a", 2)).toMatchObject({
      kind: "resolved",
      dataset: { dataset_id: "dataset-a" },
      version: { version: 2 },
    });
  });

  test("distinguishes a missing dataset from a missing version", () => {
    expect(resolveDatasetVersion(datasets, "dataset-missing", 1)).toEqual({
      kind: "dataset-not-found",
    });
    expect(resolveDatasetVersion(datasets, "dataset-a", 99)).toEqual({
      kind: "version-not-found",
      dataset: datasets[0],
    });
  });

  test("classifies a dataset with no available versions as a missing version", () => {
    expect(resolveDatasetVersion([dataset("dataset-empty", [])], "dataset-empty")).toEqual({
      kind: "version-not-found",
      dataset: dataset("dataset-empty", []),
    });
  });
});
