import type { ComponentProps } from "react";

import type { TaskEvent, TaskGetResponse, TaskState } from "@squonk/data-manager-client";

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { Box, Typography } from "@mui/material";

import { LocalTime } from "../../LocalTime";

/* When message is undefined we can guarantee that it's a TaskState */
const isEvent = (stateOrEvent: TaskState | TaskEvent): stateOrEvent is TaskEvent => {
  return !(stateOrEvent as TaskState).state;
};

export interface TimeLineProps {
  /**
   * states or events of tasks or instances
   */
  states: NonNullable<TaskGetResponse["states"] | TaskGetResponse["events"]>;
}

/**
 * Displays a timeline view of the states or events of a task or an instance
 */
export const TimeLine = ({ states }: TimeLineProps) => {
  const items = (states as Array<typeof states[number]>).filter(
    (item) => !(isEvent(item) && item.level === "DEBUG"),
  );
  return (
    <Timeline sx={{ p: 0, m: 0 }}>
      {items.map((item, itemIndex) => (
        <TimelineSection
          key={itemIndex}
          label={
            isEvent(item)
              ? item.message
              : `${item.state}${item.message ? ": " : ""}${item.message ?? ""}`
          }
          showConnector={itemIndex + 1 !== items.length}
          time={item.time}
        />
      ))}
    </Timeline>
  );
};

export interface TimelineSectionProps {
  showConnector: boolean;
  label: string;
  time: string;
}

const TimelineSection = ({ showConnector, label, time }: TimelineSectionProps) => {
  return (
    <TimelineItem sx={{ minHeight: "40px" }}>
      <TimelineOppositeContent>
        <TimeLineLabel color="textSecondary">
          <LocalTime showTime showDate={false} utcTimestamp={time} />
        </TimeLineLabel>
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot />
        {showConnector && <TimelineConnector />}
      </TimelineSeparator>
      <TimelineContent sx={{ overflowX: label.includes("\n") ? "scroll" : undefined }}>
        <TimeLineLabel>{label}</TimeLineLabel>
      </TimelineContent>
    </TimelineItem>
  );
};

export type TimeLineLabelProps = ComponentProps<typeof Typography>;

const TimeLineLabel = ({ children, ...typographyProps }: TimeLineLabelProps) => {
  if (typeof children === "string" && children.includes("\n")) {
    return (
      <Box
        component="pre"
        sx={{
          margin: 0,
          display: "inline-block",
          textAlign: "left",
          fontFamily: "'Fira Mono', monospace",
          // overflowX: "scroll",
        }}
      >
        {children}
      </Box>
    );
  }
  return (
    <Typography
      component="code"
      sx={{
        fontFamily: "'Fira Mono', monospace",
        wordBreak: "break-word",
      }}
      variant="body2"
      {...typographyProps}
    >
      {children}
    </Typography>
  );
};
