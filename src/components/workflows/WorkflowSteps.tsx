import { type RunningWorkflowStep } from "@/api/data-manager";

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { Link, Typography } from "@mui/material";
import NextJsLink from "next/link";

import { projectLinks, type ResultsState } from "../../projects/routes";
import { resultWorkflowStepInstance } from "../../projects/workflowFacts";
import { LocalTime } from "../LocalTime";

export interface WorkflowStepsProps {
  /**
   * The project the running workflow declares it belongs to; its steps ran in that project, so
   * that is the project every step's instance is addressed in.
   */
  projectId: string;
  /** Results list state each step's own link preserves. */
  resultsState?: ResultsState;
  steps: readonly RunningWorkflowStep[];
}

const stepColor = (status: RunningWorkflowStep["status"]) => {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILURE":
      return "error";
    default:
      return "info";
  }
};

/**
 * The steps one running workflow recorded, in the order it ran them. A step that ran as an
 * instance this client can address links to that instance inside the workflow's own owning
 * project; a step that named no addressable instance is still listed, without a link it invented.
 */
export const WorkflowSteps = ({ projectId, resultsState, steps }: WorkflowStepsProps) => {
  if (steps.length === 0) {
    return <Typography variant="body2">No steps found for this workflow.</Typography>;
  }

  return (
    <Timeline sx={{ p: 0, m: 0 }}>
      {steps.map((step, index) => {
        const instanceId = resultWorkflowStepInstance(step);
        const stopped = step.stopped === step.started ? undefined : step.stopped;

        return (
          <TimelineItem key={step.id}>
            <TimelineOppositeContent sx={{ flex: "unset" }}>
              <Typography variant="caption">
                <LocalTime showTime showDate={false} utcTimestamp={step.started} />
                {stopped === undefined ? null : (
                  <>
                    {" "}
                    <span style={{ fontStyle: "italic" }}>to </span>
                    <LocalTime showTime showDate={false} utcTimestamp={stopped} />
                  </>
                )}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={stepColor(step.status)} />
              {index < steps.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2">
                {instanceId === undefined ? (
                  step.name
                ) : (
                  <Link
                    component={NextJsLink}
                    href={
                      projectLinks.result(projectId, "instances", instanceId, resultsState) as never
                    }
                  >
                    {step.name}
                  </Link>
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
  );
};
