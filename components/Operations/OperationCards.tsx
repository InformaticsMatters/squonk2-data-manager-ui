import type { FC } from 'react';
import React from 'react';

import type { InstanceSummary, TaskSummary } from '@squonk/data-manager-client';

import { Grid } from '@material-ui/core';
import dayjs from 'dayjs';

import { search } from '../../utils/search';
import { OperationApplicationCard } from './OperationApplicationCard';
import { OperationJobCard } from './OperationJobCard';
import { OperationTaskCard } from './OperationTaskCard';

export interface OperationCardsProps {
  operationTypes: string[];
  searchValue: string;
  instances: InstanceSummary[];
  tasks: TaskSummary[];
}

const isTaskSummary = (
  taskOrInstance: TaskSummary | InstanceSummary,
): taskOrInstance is TaskSummary => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (taskOrInstance as TaskSummary).created !== undefined;
};

const getTimeStamp = (taskOrInstance: TaskSummary | InstanceSummary) => {
  if (isTaskSummary(taskOrInstance)) {
    return taskOrInstance.created;
  }
  return taskOrInstance.launched;
};

export const OperationCards: FC<OperationCardsProps> = ({
  operationTypes,
  searchValue,
  instances,
  tasks,
}) => {
  const cards = [
    ...(operationTypes.includes('instance') ? instances : []).filter(({ job_name, name, state }) =>
      search([job_name, name, state], searchValue),
    ),
    ...(operationTypes.includes('task') ? tasks : [])
      .filter((task) => task.purpose === 'DATASET' || task.purpose === 'FILE')
      .filter(({ processing_stage, purpose }) => search([processing_stage, purpose], searchValue)),
  ]
    .sort((a, b) => {
      const aTime = getTimeStamp(a);
      const bTime = getTimeStamp(b);
      return dayjs(aTime).isBefore(dayjs(bTime)) ? 1 : -1;
    })
    .map((instanceOrTask) => {
      if (!isTaskSummary(instanceOrTask)) {
        const instance = instanceOrTask;
        return instance.application_type === 'JOB' ? (
          <Grid item key={instance.id} xs={12}>
            <OperationJobCard instance={instance} />
          </Grid>
        ) : (
          <Grid item key={instance.id} xs={12}>
            <OperationApplicationCard instance={instance} />
          </Grid>
        );
      }
      const task = instanceOrTask;
      return (
        <Grid item key={task.id} xs={12}>
          <OperationTaskCard task={task} />
        </Grid>
      );
    });

  return (
    <Grid container spacing={2}>
      {cards}
    </Grid>
  );
};
