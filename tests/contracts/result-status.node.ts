import {
  InstanceGetResponsePhase,
  RunningWorkflowGetResponseStatus,
  TaskSummaryProcessingStage,
} from "@/api/data-manager";

import { expect, test } from "@playwright/test";

import { statusConcept } from "../../src/components/results/statusConcept";

/** Every state a result can report, against the status concept it is drawn as. */
const expectations: [state: string, concept: ReturnType<typeof statusConcept>][] = [
  [InstanceGetResponsePhase.PENDING, "queued"],
  [InstanceGetResponsePhase.RUNNING, "running"],
  [TaskSummaryProcessingStage.COPYING, "running"],
  [TaskSummaryProcessingStage.FORMATTING, "running"],
  [TaskSummaryProcessingStage.LOADING, "running"],
  [TaskSummaryProcessingStage.DELETING, "deleting"],
  [InstanceGetResponsePhase.SUCCEEDED, "succeeded"],
  [InstanceGetResponsePhase.COMPLETED, "succeeded"],
  [TaskSummaryProcessingStage.DONE, "succeeded"],
  [RunningWorkflowGetResponseStatus.SUCCESS, "succeeded"],
  [InstanceGetResponsePhase.FAILED, "failed"],
  [InstanceGetResponsePhase.CRASH_LOOP_BACKOFF, "failed"],
  [InstanceGetResponsePhase.IMAGE_PULL_BACKOFF, "failed"],
  [RunningWorkflowGetResponseStatus.FAILURE, "failed"],
  [RunningWorkflowGetResponseStatus.USER_STOPPED, "stopped"],
  [InstanceGetResponsePhase.UNKNOWN, "unknown"],
];

test.describe("result status", () => {
  for (const [state, concept] of expectations) {
    test(`${state} is drawn as ${concept}`, () => {
      expect(statusConcept(state as Parameters<typeof statusConcept>[0])).toBe(concept);
    });
  }

  test("a result with no state yet is drawn as unknown", () => {
    expect(statusConcept(undefined)).toBe("unknown");
  });

  test("every state the API defines is covered", () => {
    const states = new Set([
      ...Object.values(InstanceGetResponsePhase),
      ...Object.values(RunningWorkflowGetResponseStatus),
      ...Object.values(TaskSummaryProcessingStage),
    ]);
    expect(
      [...states].filter((state) => !expectations.some(([covered]) => covered === state)),
    ).toEqual([]);
  });
});
