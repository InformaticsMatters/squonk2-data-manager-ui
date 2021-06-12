import React, { useEffect, useState } from 'react';

import { useQueryClient } from 'react-query';

import { LinearProgress } from '@material-ui/core';
import { getGetInstancesQueryKey, useGetTask } from '@squonk/data-manager-client';

interface ProgressBarProps {
  taskId: string | null;
  isTaskProcessing: boolean;
  setIsTaskProcessing: (newValue: boolean) => void;
  endState: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  isTaskProcessing,
  setIsTaskProcessing,
  taskId,
  endState,
}) => {
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState<number | false>(2000);
  const { data, isLoading } = useGetTask(taskId ?? '', undefined, {
    query: {
      refetchInterval: pollingInterval,
      onSuccess: (task) => {
        const hasStarted = !!task.states.find((state) => state.state === endState);
        if (hasStarted) {
          setPollingInterval(false);
          setIsTaskProcessing(false);
          queryClient.invalidateQueries(getGetInstancesQueryKey());
        }
      },
    },
  });

  useEffect(() => {
    setPollingInterval(2000);
  }, [taskId]);

  return <div>{isTaskProcessing && <LinearProgress />}</div>;
};
