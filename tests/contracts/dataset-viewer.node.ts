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
  const datasetProxy = /\/api\/(?:dm-api|viewer-proxy)/u;

  test("dataset version transport hrefs have one owner", () => {
    const root = path.join(process.cwd(), "src");
    const composers = readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
      .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)))
      .filter((file) => {
        const source = readFileSync(path.join(root, file), "utf8");
        return datasetProxy.test(source) && source.includes("/dataset/");
      });

    expect(composers).toEqual(["datasets/routes.ts"]);
  });
});
