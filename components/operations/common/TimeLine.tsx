import type { FC } from 'react';
import React from 'react';

import type { InstanceGetResponse, TaskGetResponse, TaskState } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
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

import { LocalTime } from '../../localTime';

interface TimeLineProps {
  states: NonNullable<
    | InstanceGetResponse['states']
    | InstanceGetResponse['events']
    | TaskGetResponse['states']
    | TaskGetResponse['events']
  >;
}

export const TimeLine: FC<TimeLineProps> = ({ states }) => {
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
          key={`${state.time}-${stateIndex}`}
        >
          <TimelineOppositeContent>
            <Typography
              color="textSecondary"
              component="code"
              css={css`
                font-family: 'Fira Mono', monospace;
              `}
              variant="body2"
            >
              <LocalTime showTime showDate={false} utcTimestamp={state.time} />
            </Typography>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot />
            {stateIndex + 1 !== states.length && <TimelineConnector />}
          </TimelineSeparator>
          {/* When message is undefined we can guarantee that it's a TaskState */}
          <TimelineContent>
            <Typography
              component="code"
              css={css`
                font-family: 'Fira Mono', monospace;
                word-break: break-word;
              `}
              variant="body2"
            >
              {state.message ?? (state as TaskState).state}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};
