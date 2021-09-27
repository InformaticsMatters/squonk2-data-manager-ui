import React from 'react';

import type { InstanceSummary, TaskSummary } from '@squonk/data-manager-client';

import { Grid, Typography } from '@material-ui/core';
import dayjs from 'dayjs';

import { search } from '../../utils/search';
import { OperationApplicationCard } from './OperationApplicationCard';
import { OperationJobCard } from './OperationJobCard';
import { OperationTaskCard } from './OperationTaskCard';

export interface OperationCardsProps {
  /**
   * Types of operations to display. Others not present are filtered out.
   */
  operationTypes: string[];
  /**
   * Search argument by which to filter
   */
  searchValue: string;
  /**
   * Instances that might be displayed
   */
  instances: InstanceSummary[];
  /**
   * Tasks that might be displayed
   */
  tasks: TaskSummary[];
}

/**
 * Type predicate to tell apart `TaskSummary` and `InstanceSummary`
 */
const isTaskSummary = (
  taskOrInstance: TaskSummary | InstanceSummary,
): taskOrInstance is TaskSummary => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (taskOrInstance as TaskSummary).created !== undefined;
};

/**
 * Extracts the time stamp from `TaskSummary` and `InstanceSummary`
 */
const getTimeStamp = (taskOrInstance: TaskSummary | InstanceSummary) => {
  if (isTaskSummary(taskOrInstance)) {
    return taskOrInstance.created;
  }
  return taskOrInstance.launched;
};

/**
 * Manages the display of all task and instance cards
 */
export const OperationCards = ({
  operationTypes,
  searchValue,
  instances,
  tasks,
}: OperationCardsProps) => {
  // Tasks and instances are filtered first by search value
  const cards = [
    ...(operationTypes.includes('instance') ? instances : []).filter(({ job_name, name, state }) =>
      search([job_name, name, state], searchValue),
    ),
    ...(operationTypes.includes('task') ? tasks : [])
      .filter((task) => task.purpose === 'DATASET' || task.purpose === 'FILE')
      .filter(({ processing_stage, purpose }) => search([processing_stage, purpose], searchValue)),
  ]
    // Then they are sorted
    .sort((a, b) => {
      const aTime = getTimeStamp(a);
      const bTime = getTimeStamp(b);
      return dayjs(aTime).isBefore(dayjs(bTime)) ? 1 : -1;
    })
    // And lastly, a card is created from each
    .map((instanceOrTask) => {
      if (isTaskSummary(instanceOrTask)) {
        const task = instanceOrTask;
        return (
          <Grid item key={task.id} xs={12}>
            <OperationTaskCard task={task} />
          </Grid>
        );
      }
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
    });

  return cards.length ? (
    <Grid container spacing={2}>
      {cards}
    </Grid>
  ) : (
    <Typography align="center" variant="body2">
      There are no tasks or instances to display.
    </Typography>
  );
};
