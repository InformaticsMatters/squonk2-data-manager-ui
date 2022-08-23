import type { InstanceGetResponsePhase, InstanceSummaryPhase } from "@squonk/data-manager-client";

export const DONE_PHASES: InstanceSummaryPhase[] | InstanceGetResponsePhase[] = [
  "COMPLETED",
  "SUCCEEDED",
  "FAILED",
];
