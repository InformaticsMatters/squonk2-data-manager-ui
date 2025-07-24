import { type WorkflowSummary } from "@squonk/data-manager-client";

import { Box, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import A from "next/link";

import { useCurrentProjectId } from "../../../hooks/projectHooks";
import { BaseCard } from "../../BaseCard";
import { LocalTime } from "../../LocalTime";
import { RunWorkflowButton } from "./RunWorkflowButton";

export interface WorkflowRunListItem {
  id: string;
  name: string;
  version?: string;
  started?: string;
}

export interface WorkflowCardProps {
  workflow: WorkflowSummary;
  runningWorkflows?: WorkflowRunListItem[];
}

/**
 * MuiCard that displays a summary of a workflow definition, with running workflows listed in a MUI List.
 * The list matches the style of InstancesList, showing version and start time for each run.
 */
export const WorkflowCard = ({ workflow, runningWorkflows = [] }: WorkflowCardProps) => {
  const { projectId } = useCurrentProjectId();
  const hasRunning = runningWorkflows.length > 0;

  // Sort by started descending (most recent first)
  const sortedRuns = [...runningWorkflows].sort((a, b) => {
    if (a.started && b.started) {
      return new Date(b.started).getTime() - new Date(a.started).getTime();
    }
    if (a.started) {
      return -1;
    }
    if (b.started) {
      return 1;
    }
    return 0;
  });

  return (
    <BaseCard
      accentColor="#f1c40f"
      actions={() => (
        <RunWorkflowButton
          disabled={!projectId}
          name={workflow.workflow_name ?? workflow.name}
          projectId={projectId ?? ""}
          workflowId={workflow.id}
        />
      )}
      collapsed={
        hasRunning ? (
          <List dense component="ul">
            {sortedRuns.map((rw) => (
              <ListItemButton
                component={A}
                href={{ pathname: "/results/workflow/[workflowId]", query: { workflowId: rw.id } }}
                key={rw.id}
              >
                <ListItemText
                  primary={rw.name}
                  secondary={
                    <>
                      <span style={{ marginRight: 8 }}>version: {rw.version ?? "n/a"}</span>
                      {!!rw.started && <LocalTime utcTimestamp={rw.started} />}
                    </>
                  }
                  slotProps={{ primary: { variant: "body1" } }}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              No workflows currently exist
            </Typography>
          </Box>
        )
      }
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
