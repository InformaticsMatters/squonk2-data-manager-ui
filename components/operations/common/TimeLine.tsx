import React from 'react';

import type { InstanceGetResponse, TaskGetResponse, TaskState } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import type { TypographyProps } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@material-ui/lab';

import { LocalTime } from '../../LocalTime';

export interface TimeLineProps {
  /**
   * states or events of tasks or instances
   */
  states: NonNullable<
    | InstanceGetResponse['states']
    | InstanceGetResponse['events']
    | TaskGetResponse['states']
    | TaskGetResponse['events']
  >;
}

/**
 * Displays a timeline view of the states or events of a task or an instance
 */
export const TimeLine = ({ states }: TimeLineProps) => {
  return (
    <Timeline
      css={css`
        padding: 0;
        margin: 0;
      `}
    >
      {states.map((state, stateIndex) => (
        <TimelineItem
          css={css`
            min-height: 40px;
          `}
          key={stateIndex}
        >
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
            <TimeLineLabel>{state.message ?? (state as TaskState).state}</TimeLineLabel>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

const CodeTypography = (props: TypographyProps) => (
  <Typography {...props} component="code" variant="body2" />
);

const TimeLineLabel = styled(CodeTypography)`
  // Use custom mono-spaded font. See fonts in globalStyles
  font-family: 'Fira Mono', monospace;
  word-break: break-word;
`;
