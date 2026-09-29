import { getGetDatasetsQueryKey } from "@/api/data-manager/dataset";

import { expect, test } from "@playwright/test";

import { getDatasetListParams } from "../../src/datasets/datasetQuery";

test.describe("Dataset collection query", () => {
  test("uses the unparameterised generated collection identity by default", () => {
    const params = getDatasetListParams({});
    expect(params).toBeUndefined();
    expect(getGetDatasetsQueryKey(params)).toEqual(["data-manager", "dataset"]);
  });

  test("maps only approved route filters to generated request parameters", () => {
    expect(
      getDatasetListParams({
        search: "client-only",
        owner: "owner@example.org",
        editor: "editor@example.org",
        mimeType: "chemical/x-mdl-sdfile",
        labels: ["campaign", "source=screen=primary"],
      }),
    ).toEqual({
      dataset_mime_type: "chemical/x-mdl-sdfile",
      editors: "editor@example.org",
      labels: JSON.stringify({ campaign: null, source: "screen=primary" }),
      username: "owner@example.org",
    });
  });
});
