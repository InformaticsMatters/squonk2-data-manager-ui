import React, { useState } from 'react';
import { useQueryClient } from 'react-query';

import type { TaskSummary } from '@squonk/data-manager-client';
import { getGetTasksQueryKey, useDeleteTask } from '@squonk/data-manager-client/task';

import {
  Button,
  CardContent,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slide,
} from '@material-ui/core';

import { useCurrentProjectId } from '../../hooks/currentProjectHooks';
import { BaseCard } from '../BaseCard';
import { WarningDeleteButton } from '../WarningDeleteButton';
import { DateTimeListItem } from './common/DateTimeListItem';
import { HorizontalList } from './common/HorizontalList';
import { StatusIcon } from './common/StatusIcon';
import { TaskDetails } from './details/TaskDetails';

export interface TaskCardProps {
  /**
   * The task which will be displayed
   */
  task: TaskSummary;
}

/**
 * Expandable card that displays details about a task
 */
export const OperationTaskCard = ({ task }: TaskCardProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteTask } = useDeleteTask();

  const { projectId } = useCurrentProjectId();

  const [slideIn, setSlideIn] = useState(true);

  return (
    <Slide direction="right" in={slideIn}>
      <div>
        <BaseCard
          actions={
            <WarningDeleteButton
              modalId={`delete-task-${task.id}`}
              title="Delete Task"
              tooltipText="Delete Task"
              onDelete={async () => {
                await deleteTask({ taskid: task.id });
                Promise.all([
                  queryClient.invalidateQueries(getGetTasksQueryKey()),
                  queryClient.invalidateQueries(getGetTasksQueryKey({ project_id: projectId })),
                ]);
                setSlideIn(false);
              }}
            >
              {({ openModal }) => <Button onClick={openModal}>Delete</Button>}
            </WarningDeleteButton>
          }
          collapsed={
            <CardContent>
              <TaskDetails taskId={task.id} />
            </CardContent>
          }
        >
          <HorizontalList>
            <ListItem>
              <ListItemIcon>
                <StatusIcon state={task.processing_stage ?? 'UNKNOWN'} />
              </ListItemIcon>
              <ListItemText primary={task.purpose} secondary={task.processing_stage} />
            </ListItem>
            <DateTimeListItem datetimeString={task.created} />
          </HorizontalList>
        </BaseCard>
      </div>
    </Slide>
  );
};
