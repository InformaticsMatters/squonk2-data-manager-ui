import React, { FC, useEffect, useState } from 'react';

import { useQueryClient } from 'react-query';

import { css } from '@emotion/react';
import { LinearProgress, Typography, useTheme } from '@material-ui/core';
import { getGetInstancesQueryKey } from '@squonk/data-manager-client/instance';
import { useGetTask } from '@squonk/data-manager-client/task';

import type { TaskGetResponse } from '@squonk/data-manager-client';

interface ProgressBarProps {
  taskId: string | null;
  isTaskProcessing: boolean;
  setIsTaskProcessing: (newValue: boolean) => void;
  endState?: string;
}

export const ProgressBar: FC<ProgressBarProps> = ({
  isTaskProcessing,
  setIsTaskProcessing,
  taskId,
  endState,
}) => {
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);

  const [task, setTask] = useState<TaskGetResponse | null>(null);
  useGetTask(taskId ?? '', undefined, {
    query: {
      refetchInterval: pollingInterval,
      onSuccess: (task) => {
        setTask(task);

        let isFinished: boolean;
        if (endState) {
          // If the component is passed and end state we wait for that state
          isFinished = !!task.states.find((state) => state.state === endState);
        } else {
          // Otherwise we wait for a task to be `done`
          isFinished = task.done;
        }

        if (isFinished) {
          setPollingInterval(false);
          setIsTaskProcessing(false);
          queryClient.invalidateQueries(getGetInstancesQueryKey());
        }
      },
    },
  });

  useEffect(() => {
    // Restart polling when a new job in run
    setPollingInterval(2000);
    // Reset the task from the previous run
    // This just hides the last event that persists after a job is run
    setTask(null);
  }, [taskId]);

  const theme = useTheme();
  if (task === null) {
    return null;
  }

  // Get the latest status and event for display
  const status = task.states[task.states.length - 1]?.state;
  const event = task.events[task.events.length - 1]?.message;

  if (isTaskProcessing || status === 'FAILURE' || event) {
    return (
      <div
        css={css`
          margin-top: ${theme.spacing(1)}px;
        `}
      >
        {isTaskProcessing && <LinearProgress />}
        {event && <Typography variant="body2">{event}</Typography>}
        {status === 'FAILURE' && <Typography color="error">{status}</Typography>}
      </div>
    );
  } else {
    return null;
  }
};
