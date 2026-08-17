import { type RunningWorkflowSummary } from "@/api/data-manager";

import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import A from "next/link";

import { projectLinks } from "../../projects/routes";
import { CenterLoader } from "../CenterLoader";
import { LocalTime } from "../LocalTime";

export interface RunningWorkflowsListProps {
  /** The read that lists them has not answered yet, so the list cannot say it has none. */
  isLoading?: boolean;
  runningWorkflows: readonly RunningWorkflowSummary[];
}

/**
 * MuiList detailing running workflows.
 */
export const RunningWorkflowsList = ({
  isLoading = false,
  runningWorkflows,
}: RunningWorkflowsListProps) => {
  if (isLoading) {
    return <CenterLoader />;
  }

  if (runningWorkflows.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ color: "text.secondary" }} variant="body2">
          No workflows currently exist
        </Typography>
      </Box>
    );
  }

  // Sort by started descending (most recent first)
  const sortedRuns = runningWorkflows.toSorted((a, b) => {
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
      {sortedRuns.map((rw) => {
        const content = (
          <ListItemText
            primary={rw.name}
            secondary={<>{!!rw.started && <LocalTime utcTimestamp={rw.started} />}</>}
            slotProps={{ primary: { variant: "body1" } }}
          />
        );
        // A running workflow is only linkable through the project it declares it runs in; one that
        // declares none is still listed, just without a link to somewhere it might not belong.
        return rw.project.id ? (
          <ListItemButton
            component={A}
            href={projectLinks.result(rw.project.id, "workflows", rw.id) as never}
            key={rw.id}
          >
            {content}
          </ListItemButton>
        ) : (
          <ListItem key={rw.id}>{content}</ListItem>
        );
      })}
    </List>
  );
};
