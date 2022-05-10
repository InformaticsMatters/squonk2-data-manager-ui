import type { TaskEvent, TaskGetResponse, TaskState } from '@squonk/data-manager-client';

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab';
import type { TypographyProps } from '@mui/material';
import { styled, Typography } from '@mui/material';

import { LocalTime } from '../../LocalTime';

const isEvent = (stateOrEvent: TaskState | TaskEvent): stateOrEvent is TaskEvent => {
  return !(stateOrEvent as TaskState).state;
};

export interface TimeLineProps {
  /**
   * states or events of tasks or instances
   */
  states: NonNullable<TaskGetResponse['states'] | TaskGetResponse['events']>;
}

/**
 * Displays a timeline view of the states or events of a task or an instance
 */
export const TimeLine = ({ states }: TimeLineProps) => {
  return (
    <Timeline sx={{ p: 0, m: 0 }}>
      {states.map((state, stateIndex) => (
        <TimelineItem key={stateIndex} sx={{ minHeight: '40px' }}>
          <TimelineOppositeContent>
            <TimeLineLabel color="textSecondary">
              <LocalTime showTime showDate={false} utcTimestamp={state.time} />
            </TimeLineLabel>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot />
            {stateIndex + 1 !== states.length && <TimelineConnector />}
          </TimelineSeparator>
          {/* When message is undefined we can guarantee that it's a TaskState */}
          <TimelineContent>
            <TimeLineLabel>
              {isEvent(state)
                ? state.message
                : `${state.state}${state.message ? ': ' : ''}${state.message || ''}`}
            </TimeLineLabel>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

const CodeTypography = (props: TypographyProps) => (
  <Typography {...props} component="code" variant="body2" />
);

// Use custom mono-spaded font. See fonts in globalStyles
const TimeLineLabel = styled(CodeTypography)({
  fontFamily: '"Fira Mono", monospace',
  wordBreak: 'break-word',
});
