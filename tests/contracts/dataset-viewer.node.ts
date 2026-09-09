import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { type ServerResponse } from "node:http";
import path from "node:path";

import {
  classifyDatasetVersionContent,
  DATASET_VERSION_NOT_FOUND,
  reportDatasetVersionFailure,
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

  test("a refused version and an absent one each keep their own status and reason", () => {
    expect(
      classifyDatasetVersionContent({
        statusCode: 403,
        statusMessage: "Dataset is not owned by you",
      }),
    ).toEqual({
      kind: "unavailable",
      statusCode: 403,
      statusMessage: "Dataset is not owned by you",
    });
    expect(
      classifyDatasetVersionContent({ statusCode: 404, statusMessage: "Version does not exist" }),
    ).toEqual({ kind: "unavailable", statusCode: 404, statusMessage: "Version does not exist" });
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

test.describe("Dataset version failure reporting", () => {
  test("a refused version and an absent one are each answered as the service answered them", () => {
    const denied = recordedResponse();
    const missing = recordedResponse();

    expect(
      reportDatasetVersionFailure(denied, {
        props: { statusCode: 403, statusMessage: "Dataset is not owned by you" },
      }),
    ).toEqual({ props: { statusCode: 403, statusMessage: "Dataset is not owned by you" } });
    expect(
      reportDatasetVersionFailure(missing, {
        props: { statusCode: 404, statusMessage: "Version does not exist" },
      }),
    ).toEqual({ props: { statusCode: 404, statusMessage: "Version does not exist" } });
    expect(denied.statusCode).toBe(403);
    expect(denied.statusMessage).toBe("Dataset is not owned by you");
    expect(missing.statusCode).toBe(404);
    expect(missing.statusMessage).toBe("Version does not exist");
  });

  test("a rejection that accounted for nothing is answered in the viewer's own words", () => {
    const res = recordedResponse();

    expect(
      reportDatasetVersionFailure(res, { props: { statusCode: 404, statusMessage: "" } }),
    ).toEqual({ props: { statusCode: 404, statusMessage: DATASET_VERSION_NOT_FOUND } });
    expect(res.statusMessage).toBe(DATASET_VERSION_NOT_FOUND);
  });

  test("upstream words reach the status line only as a reason phrase", () => {
    const res = recordedResponse();

    expect(
      reportDatasetVersionFailure(res, {
        props: { statusCode: 403, statusMessage: "refused\r\nX-Injected: yes" },
      }),
    ).toEqual({ props: { statusCode: 403, statusMessage: "refused X-Injected: yes" } });
    expect(res.statusMessage).toBe("refused X-Injected: yes");
  });

  test("content and recoverable answers are passed through untouched", () => {
    for (const props of [successful, { statusCode: 503, statusMessage: "Try again" }]) {
      const res = recordedResponse();
      expect(reportDatasetVersionFailure(res, { props })).toEqual({ props });
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
      "datasets/routes.ts", // dataset version — the only owner
      "pages/api/dm-api/[...dmProxy].ts", // the proxy itself
      "pages/api/viewer-proxy/[...viewerProxy].ts", // the proxy itself
      "projects/routes.ts", // project file — the only owner
    ]);
  });

  test("no second module composes a dataset version resource path", () => {
    expect(handwrittenMatching(composedResourcePath)).toEqual(["datasets/routes.ts"]);
  });
});
