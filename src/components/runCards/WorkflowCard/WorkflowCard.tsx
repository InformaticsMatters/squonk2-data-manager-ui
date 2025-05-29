import { type WorkflowSummary } from "@squonk/data-manager-client";

import { Chip, Typography } from "@mui/material";

import { useCurrentProjectId } from "../../../hooks/projectHooks";
import { BaseCard } from "../../BaseCard";
import { RunWorkflowButton } from "./RunWorkflowButton";

export interface WorkflowCardProps {
  workflow: WorkflowSummary;
}

/**
 * MuiCard that displays a summary of a workflow definition.
 */
export const WorkflowCard = ({ workflow }: WorkflowCardProps) => {
  const { projectId } = useCurrentProjectId();
  return (
    <BaseCard
      actions={() => (
        <RunWorkflowButton
          disabled={!projectId}
          name={workflow.workflow_name ?? workflow.name}
          projectId={projectId ?? ""}
          workflowId={workflow.id}
        />
      )}
      header={{
        color: "#f1c40f",
        subtitle: workflow.name,
        avatar: workflow.name[0],
        title: workflow.workflow_name ?? workflow.name,
      }}
      key={workflow.id}
    >
      <Typography gutterBottom>
        {workflow.workflow_description ?? <em>No description</em>}
      </Typography>
      <Typography gutterBottom variant="body2">
        Version: {workflow.version ?? <em>n/a</em>}
      </Typography>
      <Typography gutterBottom variant="body2">
        Scope: {workflow.scope}
        {workflow.scope_id ? ` (${workflow.scope_id})` : null}
      </Typography>
      <Typography gutterBottom variant="body2">
        Validated:{" "}
        {workflow.validated ? (
          <Chip color="success" label="Validated" size="small" />
        ) : (
          <Chip color="warning" label="Not validated" size="small" />
        )}
      </Typography>
      {!!workflow.source_id && (
        <Typography gutterBottom variant="body2">
          Source Workflow ID: {workflow.source_id}
        </Typography>
      )}
    </BaseCard>
  );
};
