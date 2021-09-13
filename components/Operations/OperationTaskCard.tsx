import type { FC } from 'react';
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

import { BaseCard } from '../BaseCard';
import { useCurrentProjectId } from '../state/currentProjectHooks';
import { WarningDeleteButton } from '../WarningDeleteButton';
import { HorizontalList } from './common/HorizontalList';
import { StatusIcon } from './common/StatusIcon';
import { TaskDetails } from './details/TaskDetails';

interface TaskCardProps {
  task: TaskSummary;
}

export const OperationTaskCard: FC<TaskCardProps> = ({ task }) => {
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
          <HorizontalList datetimeString={task.created}>
            <ListItem>
              <ListItemIcon>
                <StatusIcon state={task.processing_stage ?? 'UNKNOWN'} />
              </ListItemIcon>
              <ListItemText primary={task.purpose} secondary={task.processing_stage} />
            </ListItem>
          </HorizontalList>
        </BaseCard>
      </div>
    </Slide>
  );
};
