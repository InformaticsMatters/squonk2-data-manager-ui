import { type RunningWorkflowGetResponse, type RunningWorkflowStep } from "@/api/data-manager";

import { ListItem, ListItemText } from "@mui/material";

import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { type ResultsState } from "../../projects/routes";
import { type SectionReadState } from "../../projects/sectionReads";
import { type ResultWorkflowLifecycle } from "../../projects/workflowFacts";
import { WorkflowProgress } from "./WorkflowProgress";
import { WorkflowResultCard } from "./WorkflowResultCard";

export interface ResultWorkflowDetailProps {
  /** What the caller may do with this workflow, decided by it and the project that owns it. */
  capabilities: ResultCapabilities;
  lifecycle: ResultWorkflowLifecycle;
  /**
   * The project this workflow declares it belongs to. Every link this card builds is addressed
   * inside that project.
   */
  projectId: string;
  /** Results list state this card's links preserve. */
  resultsState?: ResultsState;
  steps: readonly RunningWorkflowStep[] | undefined;
  stepsReadState: SectionReadState;
  /** The addressed workflow's own read. */
  workflow: RunningWorkflowGetResponse;
  /** Called once the Data Manager has accepted the workflow's deletion. */
  onDeleted?: () => void;
}

const lifecycleSummary = (lifecycle: ResultWorkflowLifecycle) => {
  switch (lifecycle.kind) {
    case "failed":
      return "Failed";
    case "pending":
      return "Running";
    case "stopped":
      return "Stopped";
    case "succeeded":
      return "Succeeded";
    case "unconfirmed":
    case "unestablished":
    case "unknown":
      return "Not established";
  }
};

/**
 * One addressed running workflow, presented under the project that owns it. Its definition, the
 * caller who ran it, its progress, its steps, and its stop or delete action are all taken from the
 * concrete workflow and that project, so nothing on this card is derived from a selected or
 * previously current project.
 */
export const ResultWorkflowDetail = ({
  capabilities,
  lifecycle,
  projectId,
  resultsState,
  steps,
  stepsReadState,
  workflow,
  onDeleted,
}: ResultWorkflowDetailProps) => (
  <WorkflowResultCard
    capabilities={capabilities}
    collapsed={
      <WorkflowProgress
        lifecycle={lifecycle}
        projectId={projectId}
        resultsState={resultsState}
        steps={steps}
        stepsReadState={stepsReadState}
      />
    }
    collapsedByDefault={false}
    projectId={projectId}
    resultsState={resultsState}
    workflow={workflow}
    onDeleted={onDeleted}
  >
    <ListItem>
      <ListItemText primary="Status" secondary={lifecycleSummary(lifecycle)} />
    </ListItem>
    <ListItem>
      <ListItemText primary="Workflow" secondary={workflow.workflow.name} />
    </ListItem>
    <ListItem>
      <ListItemText primary="User" secondary={workflow.running_user} />
    </ListItem>
  </WorkflowResultCard>
);
