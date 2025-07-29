import { type RunningWorkflowSummary } from "@squonk/data-manager-client";

import { Box, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import A from "next/link";

import { LocalTime } from "../LocalTime";

export interface RunningWorkflowsListProps {
  runningWorkflows: RunningWorkflowSummary[];
}

/**
 * MuiList detailing running workflows.
 */
export const RunningWorkflowsList = ({ runningWorkflows }: RunningWorkflowsListProps) => {
  if (runningWorkflows.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary" variant="body2">
          No workflows currently exist
        </Typography>
      </Box>
    );
  }

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
    <List dense component="ul">
      {sortedRuns.map((rw) => (
        <ListItemButton
          component={A}
          href={{ pathname: "/results/workflow/[workflowId]", query: { workflowId: rw.id } }}
          key={rw.id}
        >
          <ListItemText
            primary={rw.name}
            secondary={<>{!!rw.started && <LocalTime utcTimestamp={rw.started} />}</>}
            slotProps={{ primary: { variant: "body1" } }}
          />
        </ListItemButton>
      ))}
    </List>
  );
};
