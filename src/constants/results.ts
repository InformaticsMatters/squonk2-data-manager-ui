import { type InstanceGetResponsePhase, type InstanceSummaryPhase } from "@/api/data-manager";

type JobPhase = InstanceGetResponsePhase | InstanceSummaryPhase;

export const INSTANCE_DONE_PHASES: JobPhase[] = ["COMPLETED", "SUCCEEDED", "FAILED"];
