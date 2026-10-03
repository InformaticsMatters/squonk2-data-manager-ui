import {
  type InstanceGetResponsePhase,
  type RunningWorkflowGetResponseStatus,
  type TaskSummaryProcessingStage,
} from "@/api/data-manager";

import { type ConceptKey } from "../iconConcepts";

export type ResultState =
  InstanceGetResponsePhase | RunningWorkflowGetResponseStatus | TaskSummaryProcessingStage;

/** A concept a result's state can be drawn as. */
export type StatusConcept = Extract<
  ConceptKey,
  "deleting" | "failed" | "queued" | "running" | "stopped" | "succeeded" | "unknown"
>;

/**
 * The status concept a result's state is drawn as. Each family of states has its own glyph, so a
 * state is told apart by shape and not by colour alone: waiting, working, being deleted, succeeded,
 * failed, stopped by its user.
 */
export const statusConcept = (state: ResultState | undefined): StatusConcept => {
  switch (state) {
    case "PENDING":
      return "queued";
    case "COPYING":
    case "FORMATTING":
    case "LOADING":
    case "RUNNING":
      return "running";
    case "DELETING":
      return "deleting";
    case "DONE":
    case "SUCCESS":
    case "COMPLETED":
    case "SUCCEEDED":
      return "succeeded";
    case "FAILED":
    case "FAILURE":
    case "CRASH_LOOP_BACKOFF":
    case "IMAGE_PULL_BACKOFF":
      return "failed";
    case "USER_STOPPED":
      return "stopped";
    default:
      return "unknown";
  }
};
