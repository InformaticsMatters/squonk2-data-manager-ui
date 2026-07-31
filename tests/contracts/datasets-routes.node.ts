import { expect, test } from "@playwright/test";

import { datasetLinks, parseDatasetRoute } from "../../src/datasets/routes";

const datasetId = "dataset-00000000-0000-4000-8000-000000000001";

const listState = {
  search: "kinase",
  owner: "owner@example.org",
  editor: "editor@example.org",
  mimeType: "chemical/x-mdl-sdfile",
  labels: ["campaign", "source=screen"],
} as const;

test.describe("Datasets route contract", () => {
  const canonicalHrefs = [
    datasetLinks.index(),
    datasetLinks.index(listState),
    datasetLinks.dataset(datasetId, listState),
    datasetLinks.version(datasetId, 1, listState),
    datasetLinks.view(datasetId, 12, listState),
  ];

  for (const href of canonicalHrefs) {
    test(`round trips ${href}`, () => {
      expect(parseDatasetRoute(href)).toMatchObject({
        kind: "valid",
        canonicalHref: href,
        needsReplace: false,
      });
    });

    test(`removes unknown query state from ${href}`, () => {
      const contaminatedHref = `${href}${href.includes("?") ? "&" : "?"}project=secret`;
      expect(parseDatasetRoute(contaminatedHref)).toMatchObject({
        kind: "valid",
        canonicalHref: href,
        needsReplace: true,
      });
    });
  }

  test("retains only Datasets-owned list state beneath route-driven details", () => {
    expect(
      parseDatasetRoute(
        `/datasets/${datasetId}/versions/2?project=secret&search=kinase&label=z&label=a`,
      ),
    ).toEqual({
      kind: "valid",
      route: {
        kind: "version",
        datasetId,
        datasetVersion: 2,
        search: "kinase",
        labels: ["a", "z"],
      },
      canonicalHref: datasetLinks.version(datasetId, 2, { search: "kinase", labels: ["a", "z"] }),
      needsReplace: true,
    });
  });

  test("builders canonicalise set-valued query state", () => {
    const href = datasetLinks.index({ labels: ["z", "a", "z"] });
    expect(href).toBe("/datasets?label=a&label=z");
    expect(parseDatasetRoute(href)).toMatchObject({ needsReplace: false });
  });

  test("removes malformed optional filters", () => {
    expect(parseDatasetRoute("/datasets?owner=x&editor=two&editor=values&label=")).toEqual({
      kind: "valid",
      route: { kind: "index" },
      canonicalHref: "/datasets",
      needsReplace: true,
    });
  });

  test("treats malformed dataset and version identity as not found", () => {
    expect(parseDatasetRoute("/datasets/not-a-dataset")).toEqual({ kind: "not-found" });

    for (const href of [
      `/datasets/${datasetId}/versions/0`,
      `/datasets/${datasetId}/versions/01`,
      `/datasets/${datasetId}/versions/1.5`,
      `/datasets/${datasetId}/versions/9007199254740992`,
    ]) {
      expect(parseDatasetRoute(href), href).toEqual({
        kind: "not-found",
        parent: { family: "datasets", section: "detail", resourceId: datasetId },
      });
    }
  });

  test("builders reject malformed required identity", () => {
    expect(() => datasetLinks.dataset("not-a-dataset")).toThrow();
    expect(() => datasetLinks.version(datasetId, 0)).toThrow();
  });
});
