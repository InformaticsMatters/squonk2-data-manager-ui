import type { InstanceSummaryJobImageType, TaskSummary } from '@squonk/data-manager-client';
import { useGetTask } from '@squonk/data-manager-client/task';

import { css } from '@emotion/react';
import { Grid, Typography } from '@mui/material';

import { CenterLoader } from '../CenterLoader';
import { TimeLine } from './common/TimeLine';
import type { CommonDetailsProps } from './details/JobDetails/types';

export interface TaskDetailsProps extends CommonDetailsProps {
  /**
   * ID of the task
   */
  taskId: TaskSummary['id'];
  /**
   * Variant of how events should be displayed
   */
  eventsVariant?: InstanceSummaryJobImageType;
}

/**
 * Displays details of a task based on a task ID
 */
export const TaskDetails = ({
  taskId,
  eventsVariant = 'SIMPLE',
  poll = false,
}: TaskDetailsProps) => {
  const { data: task } = useGetTask(taskId, undefined, {
    query: { refetchInterval: poll ? 5000 : undefined },
  });

  if (task === undefined) {
    return <CenterLoader />;
  }

  return (
    <Grid container spacing={2}>
      <Grid item md={4} xs={12}>
        <Typography align="center" component="h3" variant="h6">
          <b>States</b>
        </Typography>
        <TimeLine states={task.states ?? []} />
      </Grid>
      <Grid item md={8} xs={12}>
        <Typography align="center" component="h3" variant="h6">
          <b>Events</b>
        </Typography>
        {eventsVariant === 'SIMPLE' ? (
          <TimeLine states={task.events ?? []} />
        ) : (
          // But next-flow jobs only give a single block of text as output so we display these
          // in a monospace font
          <pre
            css={css`
              margin: 0;
              display: inline-block;
              text-align: left;
              font-family: 'Fira Mono', monospace;
            `}
          >
            {task.events?.[task.events.length - 1]?.message}
          </pre>
        )}
      </Grid>
    </Grid>
  );
};
