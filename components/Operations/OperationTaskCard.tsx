import type { FC } from 'react';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';

import type { TaskSummary } from '@squonk/data-manager-client';
import { getGetTasksQueryKey, useDeleteTask } from '@squonk/data-manager-client/task';

import { css } from '@emotion/react';
import { Button, CardContent, Slide, Typography, useTheme } from '@material-ui/core';

import { BaseCard } from '../BaseCard';
import { LocalTime } from '../LocalTime/LocalTime';
import { useCurrentProjectId } from '../state/currentProjectHooks';
import { WarningDeleteButton } from '../WarningDeleteButton';
import { StatusIcon } from './common/StatusIcon';
import { TaskDetails } from './details/TaskDetails';

interface TaskCardProps {
  task: TaskSummary;
}

export const OperationTaskCard: FC<TaskCardProps> = ({ task }) => {
  const theme = useTheme();

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
          <Typography
            css={css`
              display: flex;
              align-items: center;
              gap: ${theme.spacing(1)}px;
            `}
          >
            {task.purpose} •{' '}
            {task.processing_stage && (
              <>
                <StatusIcon state={task.processing_stage} />
                {task.processing_stage}
              </>
            )}
            <LocalTime
              css={css`
                margin-left: auto;
              `}
              utcTimestamp={task.created}
            />
          </Typography>
        </BaseCard>
      </div>
    </Slide>
  );
};
