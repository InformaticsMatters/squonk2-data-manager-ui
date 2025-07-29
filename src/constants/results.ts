import {
  type InstanceGetResponsePhase,
  type InstanceSummaryPhase,
  type RunningWorkflowGetResponseStatus,
  type RunningWorkflowSummaryStatus,
} from "@squonk/data-manager-client";

type JobPhase = InstanceGetResponsePhase | InstanceSummaryPhase;
type WorkflowPhase = RunningWorkflowGetResponseStatus | RunningWorkflowSummaryStatus;

export const INSTANCE_DONE_PHASES: JobPhase[] = ["COMPLETED", "SUCCEEDED", "FAILED"];
export const WORKFLOW_DONE_PHASES: WorkflowPhase[] = ["FAILURE", "SUCCESS", "USER_STOPPED"];
