import { type RunningWorkflowStep } from "@/api/data-manager";

import { Alert, Typography } from "@mui/material";

import { type ResultsState } from "../../projects/routes";
import { type SectionReadState } from "../../projects/sectionReads";
import { type ResultWorkflowLifecycle } from "../../projects/workflowFacts";
import { CenterLoader } from "../CenterLoader";
import { WorkflowSteps } from "./WorkflowSteps";

/**
 * What the workflow's own read last said about its progress. A workflow that failed says so with
 * the Data Manager's own words, a workflow a caller stopped says that instead of an outcome, a
 * read that could not be made says that instead of either, and none of them is ever presented as a
 * workflow that finished its work.
 */
const WorkflowLifecycleAlert = ({ lifecycle }: { lifecycle: ResultWorkflowLifecycle }) => {
  switch (lifecycle.kind) {
    case "failed":
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {lifecycle.reason}
        </Alert>
      );
    case "stopped":
    case "unconfirmed":
    case "unknown":
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {lifecycle.reason}
        </Alert>
      );
    case "pending":
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          This workflow is still running.
        </Alert>
      );
    case "succeeded":
    case "unestablished":
      return null;
  }
};

export interface WorkflowStepsPanelProps {
  /** The project the workflow declares; its steps are addressed inside that project. */
  projectId: string;
  resultsState?: ResultsState;
  steps: readonly RunningWorkflowStep[] | undefined;
  /** How the steps read answered, so steps that could not be read are not read as none. */
  stepsReadState: SectionReadState;
}

/**
 * The steps one running workflow has reached. Steps that could not be read say so rather than
 * reading as a workflow that took none. This says nothing about the workflow's own outcome, so it
 * can be shown beside an account of that outcome without ever contradicting one.
 */
export const WorkflowStepsPanel = ({
  projectId,
  resultsState,
  steps,
  stepsReadState,
}: WorkflowStepsPanelProps) => (
  <>
    <Typography gutterBottom variant="h6">
      Workflow Steps
    </Typography>
    {steps === undefined ? (
      stepsReadState.kind === "available" ? (
        <CenterLoader />
      ) : (
        <Alert severity="warning">The steps of this workflow could not be read.</Alert>
      )
    ) : (
      <WorkflowSteps projectId={projectId} resultsState={resultsState} steps={steps} />
    )}
  </>
);

export interface WorkflowProgressProps extends WorkflowStepsPanelProps {
  lifecycle: ResultWorkflowLifecycle;
}

/**
 * The steps one running workflow has reached, presented under what its lifecycle says about them.
 * Both come from the addressed workflow's own read, so the outcome stated here and the steps shown
 * beneath it always describe the same read of the same workflow.
 */
export const WorkflowProgress = ({ lifecycle, ...steps }: WorkflowProgressProps) => (
  <>
    <WorkflowLifecycleAlert lifecycle={lifecycle} />
    <WorkflowStepsPanel {...steps} />
  </>
);
