import type { FC } from 'react';
import React from 'react';

import type { TaskSummary } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import { Typography, useTheme } from '@material-ui/core';

import { LocalTime } from '../LocalTime/LocalTime';
import { BaseCard } from './common/BaseCard';
import { StatusIcon } from './common/StatusIcon';
import { TaskDetails } from './details/TaskDetails';

interface TaskCardProps {
  task: TaskSummary;
}

export const OperationTaskCard: FC<TaskCardProps> = ({ task }) => {
  const theme = useTheme();

  return (
    <BaseCard collapsed={<TaskDetails taskId={task.id} />}>
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
  );
};
