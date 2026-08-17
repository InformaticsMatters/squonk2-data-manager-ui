import { type RunningWorkflowSummary, type WorkflowSummary } from "@/api/data-manager";

import { Typography } from "@mui/material";

import { type RunState } from "../../../projects/routes";
import { BaseCard } from "../../BaseCard";
import { RunDefinitionButton } from "../RunDefinitionButton";
import { RunningWorkflowsList } from "../RunningWorkflowsList";

export interface WorkflowCardProps {
  /** The read listing this project's running workflows has not answered yet. */
  executionsLoading?: boolean;
  projectId: string;
  /** This definition's running workflows inside the project that owns them. */
  runningWorkflows: readonly RunningWorkflowSummary[];
  runState: RunState;
  workflow: WorkflowSummary;
}

/**
 * MuiCard that displays a summary of a workflow definition, linking to its own canonical
 * definition route and listing the addressed project's running workflows of it.
 *
 * What running this definition requires is not stated here: the section states once what the
 * project requires of every definition, and the modal this card opens states what this definition
 * requires of its own accord.
 */
export const WorkflowCard = ({
  executionsLoading,
  projectId,
  runningWorkflows,
  runState,
  workflow,
}: WorkflowCardProps) => (
  <BaseCard
    accentColor="#f1c40f"
    actions={
      <RunDefinitionButton
        definitionId={workflow.id}
        definitionLabel={workflow.workflow_name ?? workflow.name}
        definitionType="workflows"
        projectId={projectId}
        runState={runState}
      />
    }
    collapsed={
      <RunningWorkflowsList isLoading={executionsLoading} runningWorkflows={runningWorkflows} />
    }
    header={{
      subtitle: workflow.name,
      avatar: workflow.name[0],
      title: workflow.workflow_name ?? workflow.name,
    }}
  >
    <Typography
      sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold" }}
      variant="caption"
    >
      Workflow
    </Typography>
    <Typography gutterBottom>{workflow.workflow_description ?? <em>No description</em>}</Typography>
    <Typography gutterBottom variant="body2">
      Version: {workflow.version ?? <em>n/a</em>}
    </Typography>
  </BaseCard>
);
