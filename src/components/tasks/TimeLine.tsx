import { type ComponentProps } from "react";

import {
  type TaskEvent,
  type TaskEventLevel,
  type TaskGetResponse,
  type TaskState,
} from "@squonk/data-manager-client";

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  type TimelineDotProps,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { Box, Tooltip, Typography } from "@mui/material";

import { firaMonoFont } from "../../constants/fonts";
import { useEventDebugMode } from "../../state/eventDebugMode";
import { LocalTime } from "../LocalTime";

/* When message is undefined we can guarantee that it's a TaskState */
const isEvent = (stateOrEvent: TaskEvent | TaskState): stateOrEvent is TaskEvent => {
  return !(stateOrEvent as TaskState).state;
};

const getColorFromEventLevel = (level: TaskEventLevel): TimelineDotProps["color"] => {
  switch (level) {
    case "CRITICAL":
      return "error";
    case "DEBUG":
      return "grey";
    case "ERROR":
      return "error";
    case "INFO":
      return "info";
    case "WARNING":
      return "warning";
    default:
      return undefined;
  }
};

export interface TimeLineProps {
  /**
   * states or events of tasks or instances
   */
  states: NonNullable<TaskGetResponse["events"] | TaskGetResponse["states"]>;
}

/**
 * Displays a timeline view of the states or events of a task or an instance
 */
export const TimeLine = ({ states }: TimeLineProps) => {
  const [debug] = useEventDebugMode();

  const items = (states as (typeof states)[number][]).filter(
    (item) => !(!debug && isEvent(item) && item.level === "DEBUG"),
  );
  return (
    <Timeline sx={{ p: 0, m: 0 }}>
      {items.map((item, itemIndex) => (
        <TimelineSection
          color={isEvent(item) ? getColorFromEventLevel(item.level) : undefined}
          // eslint-disable-next-line react/no-array-index-key
          key={itemIndex}
          label={
            isEvent(item)
              ? item.message
              : `${item.state}${item.message ? ": " : ""}${item.message ?? ""}`
          }
          separatorLabel={isEvent(item) ? item.level : undefined}
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
  color?: TimelineDotProps["color"];
  separatorLabel?: string;
}

const TimelineSection = ({
  showConnector,
  label,
  time,
  color = "grey",
  separatorLabel,
}: TimelineSectionProps) => {
  return (
    <TimelineItem sx={{ minHeight: "40px" }}>
      <TimelineOppositeContent sx={{ flex: "unset" }}>
        <TimeLineLabel color="textSecondary">
          <LocalTime showTime showDate={false} utcTimestamp={time} />
        </TimeLineLabel>
      </TimelineOppositeContent>
      <TimelineSeparator>
        {separatorLabel === undefined ? (
          <TimelineDot color={color} />
        ) : (
          <Tooltip title={separatorLabel}>
            <TimelineDot color={color} />
          </Tooltip>
        )}

        {!!showConnector && <TimelineConnector />}
      </TimelineSeparator>
      <TimelineContent sx={{ overflowX: label.includes("\n") ? "auto" : undefined }}>
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
        className={firaMonoFont.className}
        component="pre"
        sx={{ fontSize: "body2.fontSize", m: 0, display: "inline-block", textAlign: "left" }}
      >
        {children}
      </Box>
    );
  }
  return (
    <Typography
      className={firaMonoFont.className}
      component="code"
      sx={{ wordBreak: "break-word" }}
      variant="body2"
      {...typographyProps}
    >
      {children}
    </Typography>
  );
};
