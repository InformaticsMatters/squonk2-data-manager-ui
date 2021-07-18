import React, { FC } from 'react';

import type { TaskSummary } from '@squonk/data-manager-client';
import { useGetTask } from '@squonk/data-manager-client/task';

import { Grid } from '@material-ui/core';

import { TimeLine } from '../common/TimeLine';

interface TaskDetailsProps {
  taskId: TaskSummary['id'];
}

export const TaskDetails: FC<TaskDetailsProps> = ({ taskId }) => {
  const { data: task } = useGetTask(taskId);

  return task ? (
    <Grid container spacing={2}>
      <Grid item sm={6} xs={12}>
        <TimeLine states={task.states ?? []} />
      </Grid>
      <Grid item sm={6} xs={12}>
        <TimeLine states={task.events ?? []} />
      </Grid>
    </Grid>
  ) : (
    <p>Loading...</p>
  );
};
