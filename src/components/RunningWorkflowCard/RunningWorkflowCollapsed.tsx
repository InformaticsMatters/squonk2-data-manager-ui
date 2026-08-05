import { useGetRunningWorkflowSteps } from "@/api/data-manager/workflow";

import {
  AccountTreeRounded as AccountTreeRoundedIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import {
  Alert,
  Box,
  Divider,
  Link,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import NextJsLink from "next/link";

import { usePolledGetWorkflow } from "../../hooks/usePolledGetWorkflow";
import { projectLinks } from "../../projects/routes";
import { getErrorMessage } from "../../utils/next/orvalError";
import { CenterLoader } from "../CenterLoader";
import { HorizontalList } from "../HorizontalList";
import { LocalTime } from "../LocalTime";

export interface RunningWorkflowCollapsedProps {
  runningWorkflowId: string;
  /** The project the running workflow itself declares; its step instances run in that project. */
  projectId: string;
}

export const RunningWorkflowCollapsed = ({
  projectId,
  runningWorkflowId,
}: RunningWorkflowCollapsedProps) => {
  const {
    data: workflow,
    isLoading: isWorkflowLoading,
    error: workflowError,
  } = usePolledGetWorkflow(runningWorkflowId);
  const {
    data: steps,
    isLoading: isStepsLoading,
    error: stepsError,
  } = useGetRunningWorkflowSteps(runningWorkflowId, {
    query: { select: (data) => data.running_workflow_steps },
  });

  if (isWorkflowLoading || isStepsLoading) {
    return <CenterLoader />;
  }

  if (workflowError) {
    return (
      <Alert severity="error">Failed to load workflow: {getErrorMessage(workflowError)}</Alert>
    );
  }
  if (stepsError) {
    return (
      <Alert severity="error">Failed to load workflow steps: {getErrorMessage(stepsError)}</Alert>
    );
  }

  // Expanded content: Timeline of steps
  const timeline =
    steps && steps.length > 0 ? (
      <Timeline sx={{ p: 0, m: 0 }}>
        {steps.map((step, idx) => {
          const showStopped = step.stopped && step.stopped !== step.started;
          return (
            <TimelineItem key={step.id}>
              <TimelineOppositeContent sx={{ flex: "unset" }}>
                <Typography variant="caption">
                  {!!step.started && (
                    <LocalTime showTime showDate={false} utcTimestamp={step.started} />
                  )}
                  {!!showStopped && (
                    <>
                      {" "}
                      <span style={{ fontStyle: "italic" }}>to </span>
                      {!!step.stopped && (
                        <LocalTime showTime showDate={false} utcTimestamp={step.stopped} />
                      )}
                    </>
                  )}
                </Typography>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot
                  color={
                    step.status === "SUCCESS"
                      ? "success"
                      : step.status === "FAILURE"
                        ? "error"
                        : "info"
                  }
                />
                {idx < steps.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2">
                  {step.instance_id ? (
                    <Link
                      component={NextJsLink}
                      href={projectLinks.result(projectId, "instances", step.instance_id) as never}
                    >
                      {step.name}
                    </Link>
                  ) : (
                    step.name
                  )}
                </Typography>
                <Typography variant="body2">Status: {step.status}</Typography>
                {!!step.error_msg && (
                  <Typography color="error" variant="body2">
                    Error: {step.error_msg}
                  </Typography>
                )}
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    ) : (
      <Typography variant="body2">No steps found for this workflow.</Typography>
    );

  // Collapsed content: key workflow details and timeline (expanded content)
  return (
    <Box>
      <HorizontalList>
        <ListItem>
          <ListItemIcon sx={{ minWidth: "40px" }}>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary={workflow?.running_user} secondary="User" />
        </ListItem>
        {!!workflow?.project.name && (
          <ListItem>
            <ListItemIcon sx={{ minWidth: "40px" }}>
              <AccountTreeRoundedIcon />
            </ListItemIcon>
            <ListItemText primary={workflow.project.name} secondary="Project" />
          </ListItem>
        )}
      </HorizontalList>
      <Divider sx={{ my: 2 }} />
      <Typography gutterBottom variant="h6">
        Workflow Steps
      </Typography>
      {timeline}
    </Box>
  );
};
