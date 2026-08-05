import { expect, test } from "@playwright/test";

import { datasetLinks, datasetTransportLinks, parseDatasetRoute } from "../../src/datasets/routes";

const datasetId = "dataset-00000000-0000-4000-8000-000000000001";

const listState = {
  search: "kinase",
  owner: "owner@example.org",
  editor: "editor@example.org",
  mimeType: "chemical/x-mdl-sdfile",
  labels: ["campaign", "source=screen"],
} as const;

test.describe("Datasets route contract", () => {
  const listQuery =
    "search=kinase&owner=owner%40example.org&editor=editor%40example.org" +
    "&type=chemical%2Fx-mdl-sdfile&label=campaign&label=source%3Dscreen";
  const canonicalHrefs = [
    ["/datasets", () => datasetLinks.index()],
    [`/datasets?${listQuery}`, () => datasetLinks.index(listState)],
    [`/datasets/${datasetId}?${listQuery}`, () => datasetLinks.dataset(datasetId, listState)],
    [
      `/datasets/${datasetId}/versions/1?${listQuery}`,
      () => datasetLinks.version(datasetId, 1, listState),
    ],
    [
      `/datasets/${datasetId}/versions/12/view?${listQuery}`,
      () => datasetLinks.view(datasetId, 12, listState),
    ],
  ] as const;

  for (const [href, buildHref] of canonicalHrefs) {
    test(`round trips ${href}`, () => {
      expect(buildHref()).toBe(href);
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

const withEnvBasePath = <TResult>(basePath: string | undefined, read: () => TResult) => {
  const previous = process.env.NEXT_PUBLIC_BASE_PATH;
  if (basePath === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = basePath;
  }
  try {
    return read();
  } finally {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    } else {
      process.env.NEXT_PUBLIC_BASE_PATH = previous;
    }
  }
};

test.describe("Dataset version transport contract", () => {
  test("transport hrefs address the exact dataset version", () => {
    expect(withEnvBasePath(undefined, () => datasetTransportLinks.download(datasetId, 12))).toBe(
      `/api/dm-api/dataset/${datasetId}/12`,
    );
    expect(withEnvBasePath(undefined, () => datasetTransportLinks.browserView(datasetId, 12))).toBe(
      `/api/viewer-proxy/dataset/${datasetId}/12`,
    );
  });

  test("transport hrefs carry the deployment base path", () => {
    expect(
      withEnvBasePath("/data-manager-ui", () => datasetTransportLinks.download(datasetId, 1)),
    ).toBe(`/data-manager-ui/api/dm-api/dataset/${datasetId}/1`);
    expect(
      withEnvBasePath("/data-manager-ui", () => datasetTransportLinks.browserView(datasetId, 1)),
    ).toBe(`/data-manager-ui/api/viewer-proxy/dataset/${datasetId}/1`);
  });

  test("transport builders reject malformed identity", () => {
    expect(() => datasetTransportLinks.download("not-a-dataset", 1)).toThrow();
    expect(() => datasetTransportLinks.browserView("not-a-dataset", 1)).toThrow();
    expect(() => datasetTransportLinks.download(datasetId, 0)).toThrow();
    expect(() => datasetTransportLinks.browserView(datasetId, 1.5)).toThrow();
  });
});
