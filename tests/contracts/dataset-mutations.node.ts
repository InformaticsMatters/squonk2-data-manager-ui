import { type DatasetSummary, type DatasetVersionSummary } from "@/api/data-manager";

import { expect, test } from "@playwright/test";

import {
  evaluateDatasetDeletionCapability,
  evaluateDatasetEditorCapability,
  evaluateDatasetLabelCapability,
  evaluatePlatformDatasetAction,
} from "../../src/datasets/capabilities";
import { datasetDeletionLifecycle, nextVersionAfterDeletion } from "../../src/datasets/mutations";

const version = (
  versionNumber: number,
  owner = "owner@example.org",
  processingStage: DatasetVersionSummary["processing_stage"] = "DONE",
): DatasetVersionSummary => ({
  file_name: `dataset-v${versionNumber}.sdf`,
  owner,
  processing_stage: processingStage,
  projects: [],
  published: "2026-01-02T03:04:05Z",
  source_ref: `dataset-v${versionNumber}.sdf`,
  type: "chemical/x-mdl-sdfile",
  version: versionNumber,
});

const dataset = (editors: string[] = ["editor@example.org"]): DatasetSummary => ({
  dataset_id: "dataset-a",
  editors,
  versions: [version(1), version(3), version(2)],
});

test.describe("Dataset mutation capabilities", () => {
  const cases = [
    { caller: "owner@example.org", expected: "enabled", name: "owner" },
    { caller: "editor@example.org", expected: "enabled", name: "editor" },
    { caller: "viewer@example.org", expected: "disabled", name: "non-editor" },
  ] as const;

  for (const { caller, expected, name } of cases) {
    test(`${name} label, editor, and deletion capabilities are explicit`, () => {
      const facts = { caller: { username: caller }, dataset: dataset(), version: version(1) };
      expect(evaluateDatasetLabelCapability(facts).status).toBe(expected);
      expect(evaluateDatasetEditorCapability(facts).status).toBe(expected);
      expect(evaluateDatasetDeletionCapability(facts).status).toBe(expected);
    });
  }

  test("missing and stale facts remain discoverable for authoritative evaluation", () => {
    for (const facts of ["missing", "stale"] as const) {
      for (const evaluate of [
        evaluateDatasetLabelCapability,
        evaluateDatasetEditorCapability,
        evaluateDatasetDeletionCapability,
      ]) {
        expect(
          evaluate({
            caller: { username: undefined },
            dataset: dataset(),
            facts,
            version: version(1),
          }),
        ).toEqual({
          reason: "Your permission will be confirmed when you use this action.",
          status: "enabled",
        });
      }
    }
  });

  test("unsafe version lifecycle disables deletion with a concise reason", () => {
    expect(
      evaluateDatasetDeletionCapability({
        caller: { username: "editor@example.org" },
        dataset: dataset(),
        version: version(1, "owner@example.org", "COPYING"),
      }),
    ).toEqual({
      reason: "This version is not currently available for deletion.",
      status: "disabled",
    });
  });

  test("versions that have reached formatting remain deletable", () => {
    for (const processingStage of ["FORMATTING", "LOADING", "FAILED", "DONE"] as const) {
      expect(
        evaluateDatasetDeletionCapability({
          caller: { username: "editor@example.org" },
          dataset: dataset(),
          version: version(1, "owner@example.org", processingStage),
        }).status,
      ).toBe("enabled");
    }
  });

  test("platform-only actions follow the shared hidden rule", () => {
    expect(evaluatePlatformDatasetAction(false)).toEqual({ status: "hidden" });
    expect(evaluatePlatformDatasetAction(true)).toEqual({ status: "enabled" });
  });
});

test.describe("Dataset deletion lifecycle", () => {
  test("does not treat accepted or running tasks as deletion success", () => {
    expect(datasetDeletionLifecycle(undefined)).toEqual({ status: "pending" });
    expect(datasetDeletionLifecycle({ done: false })).toEqual({ status: "pending" });
  });

  test("requires a terminal zero exit code", () => {
    expect(datasetDeletionLifecycle({ done: true, exit_code: 0 })).toEqual({ status: "succeeded" });
    expect(datasetDeletionLifecycle({ done: true, exit_code: 17 })).toEqual({
      exitCode: 17,
      status: "failed",
    });
    expect(datasetDeletionLifecycle({ done: true })).toEqual({
      exitCode: undefined,
      status: "failed",
    });
  });

  test("selects the highest remaining version or the list without relying on response order", () => {
    expect(nextVersionAfterDeletion(dataset().versions, 3)).toEqual({
      status: "version",
      version: 2,
    });
    expect(nextVersionAfterDeletion([version(1)], 1)).toEqual({ status: "list" });
  });
});
