import {
  type InstanceGetResponsePhase,
  type InstanceSummaryPhase,
} from "@squonk/data-manager-client";

export const DONE_PHASES: InstanceGetResponsePhase[] | InstanceSummaryPhase[] = [
  "COMPLETED",
  "SUCCEEDED",
  "FAILED",
];
