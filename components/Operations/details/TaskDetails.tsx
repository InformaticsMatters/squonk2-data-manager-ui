import type { FC } from 'react';
import React from 'react';

import type { TaskSummary } from '@squonk/data-manager-client';
import { useGetTask } from '@squonk/data-manager-client/task';

import { Grid } from '@material-ui/core';

import { CenterLoader } from '../../CenterLoader';
import { TimeLine } from '../common/TimeLine';

interface TaskDetailsProps {
  taskId: TaskSummary['id'];
}

export const TaskDetails: FC<TaskDetailsProps> = ({ taskId }) => {
  const { data: task } = useGetTask(taskId);

  return task === undefined ? (
    <CenterLoader />
  ) : (
    <Grid container spacing={2}>
      <Grid item sm={6} xs={12}>
        <TimeLine states={task.states ?? []} />
      </Grid>
      <Grid item sm={6} xs={12}>
        <TimeLine states={task.events ?? []} />
      </Grid>
    </Grid>
  );
};
