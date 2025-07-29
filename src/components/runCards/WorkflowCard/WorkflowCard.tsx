import { type RunningWorkflowSummary, type WorkflowSummary } from "@squonk/data-manager-client";

import { Typography } from "@mui/material";

import { useCurrentProjectId } from "../../../hooks/projectHooks";
import { BaseCard } from "../../BaseCard";
import { RunningWorkflowsList } from "../RunningWorkflowsList";
import { RunWorkflowButton } from "./RunWorkflowButton";

export interface WorkflowCardProps {
  workflow: WorkflowSummary;
  runningWorkflows?: RunningWorkflowSummary[];
}

/**
 * MuiCard that displays a summary of a workflow definition, with running workflows listed in a MUI List.
 * The list matches the style of InstancesList, showing version and start time for each run.
 */
export const WorkflowCard = ({ workflow, runningWorkflows = [] }: WorkflowCardProps) => {
  const { projectId } = useCurrentProjectId();

  return (
    <BaseCard
      accentColor="#f1c40f"
      actions={({ setExpanded }) => (
        <RunWorkflowButton
          disabled={!projectId}
          name={workflow.workflow_name ?? workflow.name}
          projectId={projectId ?? ""}
          workflowId={workflow.id}
          onLaunch={() => setExpanded(true)}
        />
      )}
      collapsed={<RunningWorkflowsList runningWorkflows={runningWorkflows} />}
      header={{
        subtitle: workflow.name,
        avatar: workflow.name[0],
        title: workflow.workflow_name ?? workflow.name,
      }}
      key={workflow.id}
    >
      <Typography
        color="text.secondary"
        sx={{ textTransform: "uppercase", fontWeight: "bold" }}
        variant="caption"
      >
        Workflow
      </Typography>
      <Typography gutterBottom>
        {workflow.workflow_description ?? <em>No description</em>}
      </Typography>
      <Typography gutterBottom variant="body2">
        Version: {workflow.version ?? <em>n/a</em>}
      </Typography>
    </BaseCard>
  );
};
