import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { type ServerResponse } from "node:http";
import path from "node:path";

import {
  classifyDatasetVersionContent,
  concealDatasetVersionAbsence,
} from "../../src/datasets/viewerContent";

const successful = {
  content: "acceptance dataset version 1\n",
  originalContentLength: 29,
  truncated: false,
};

test.describe("Dataset version content contract", () => {
  test("delivered content is displayed", () => {
    expect(classifyDatasetVersionContent(successful)).toEqual({
      kind: "content",
      content: successful,
    });
  });

  test("empty content is still content rather than absence", () => {
    const empty = { ...successful, content: "" };
    expect(classifyDatasetVersionContent(empty)).toEqual({ kind: "content", content: empty });
  });

  test("missing and forbidden versions read identically", () => {
    for (const statusCode of [403, 404]) {
      expect(
        classifyDatasetVersionContent({ statusCode, statusMessage: "Not permitted" }),
        String(statusCode),
      ).toEqual({ kind: "missing" });
    }
  });

  test("transport failures remain retryable", () => {
    for (const statusCode of [401, 429, 500, 502, 503, 504]) {
      expect(
        classifyDatasetVersionContent({ statusCode, statusMessage: "Try again" }),
        String(statusCode),
      ).toEqual({ kind: "recoverable" });
    }
  });

  test("unusable status facts stay retryable rather than claiming absence", () => {
    for (const statusCode of [Number.NaN, 0, -1]) {
      expect(
        classifyDatasetVersionContent({ statusCode, statusMessage: "Unknown" }),
        String(statusCode),
      ).toEqual({ kind: "recoverable" });
    }
  });

  test("other rejections keep their own status", () => {
    expect(
      classifyDatasetVersionContent({ statusCode: 400, statusMessage: "Bad request" }),
    ).toEqual({ kind: "failed", statusCode: 400, statusMessage: "Bad request" });
  });
});

const recordedResponse = () => ({ statusCode: 200, statusMessage: "" }) as ServerResponse;

test.describe("Dataset version absence concealment", () => {
  test("a denied version answers exactly as a missing one", () => {
    const denied = recordedResponse();
    const missing = recordedResponse();
    const deniedResult = concealDatasetVersionAbsence(denied, {
      props: { statusCode: 403, statusMessage: "fixture-forbidden" },
    });
    const missingResult = concealDatasetVersionAbsence(missing, {
      props: { statusCode: 404, statusMessage: "dm-route-not-found" },
    });

    expect(deniedResult).toEqual(missingResult);
    expect(deniedResult).toEqual({
      props: { statusCode: 404, statusMessage: "Dataset version not found" },
    });
    expect(denied.statusCode).toBe(404);
    expect(denied.statusCode).toBe(missing.statusCode);
  });

  test("content and recoverable answers are passed through untouched", () => {
    for (const props of [successful, { statusCode: 503, statusMessage: "Try again" }]) {
      const res = recordedResponse();
      expect(concealDatasetVersionAbsence(res, { props })).toEqual({ props });
      expect(res.statusCode).toBe(200);
    }
  });
});

test.describe("Dataset version viewer cutover", () => {
  test("the legacy dataset version page no longer exists", () => {
    expect(existsSync(path.join(process.cwd(), "src/pages/dataset"))).toBe(false);
  });

  const typescriptSource = /\.tsx?$/u;
  const dataManagerProxy = /\/api\/(?:dm-api|viewer-proxy)/u;
  // Building the path, rather than calling the builder, is what makes a second owner.
  const composedResourcePath = /`\/dataset\/\$\{/u;
  // The Orval trees are regenerated from the OpenAPI documents, so they own no handwritten route.
  const generated = /(?:^|\/)generated\//u;

  /** Handwritten modules whose source matches, as forward-slash paths relative to `src`. */
  const handwrittenMatching = (matches: RegExp) => {
    const root = path.join(process.cwd(), "src");
    return readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
      .map((entry) =>
        path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
      )
      .filter((file) => !generated.test(file))
      .filter((file) => matches.test(readFileSync(path.join(root, file), "utf8")))
      .toSorted();
  };

  test("dataset version transport hrefs have one owner", () => {
    // Every module allowed to name a Data Manager proxy, and the resource each addresses through
    // it. A module reaching a proxy from anywhere else fails this list rather than quietly becoming
    // a second owner of a transport href.
    expect(handwrittenMatching(dataManagerProxy)).toEqual([
      "components/ViewFilePopover/BrowserViewerListItem.tsx", // project file
      "datasets/routes.ts", // dataset version — the only owner
      "features/ProjectTable/FileActions.tsx", // project file
      "features/SDFViewer/useGetSDFSchema.ts", // project file
      "pages/api/dm-api/[...dmProxy].ts", // the proxy itself
      "pages/api/viewer-proxy/[...viewerProxy].ts", // the proxy itself
      "utils/app/routes.ts", // project file builder
    ]);
  });

  test("no second module composes a dataset version resource path", () => {
    expect(handwrittenMatching(composedResourcePath)).toEqual(["datasets/routes.ts"]);
  });
});
