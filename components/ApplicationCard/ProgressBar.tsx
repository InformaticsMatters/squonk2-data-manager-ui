import React, { useEffect, useState } from 'react';

import { useQueryClient } from 'react-query';

import { LinearProgress } from '@material-ui/core';
import { Task, getGetInstancesQueryKey, useGetTask } from '@squonk/data-manager-client';

interface ProgressBarProps {
  taskId: string | null;
  isTaskProcessing: boolean;
  setIsTaskProcessing: (newValue: boolean) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  isTaskProcessing,
  setIsTaskProcessing,
  taskId,
}) => {
  const queryClient = useQueryClient();
  const [interval, setInterval] = useState<number | false>(2000);
  const { data, isLoading } = useGetTask(taskId ?? '', undefined, {
    query: {
      refetchInterval: interval,
      onSuccess: (data) => {
        const task = data as Task | undefined;
        const hasStarted = !!task?.states?.find((state) => state.state === 'STARTED');
        if (hasStarted) {
          setInterval(false);
          setIsTaskProcessing(false);
          queryClient.invalidateQueries(getGetInstancesQueryKey());
        }
      },
    },
  });

  useEffect(() => {
    setInterval(2000);
  }, [taskId]);

  return <div>{isTaskProcessing && <LinearProgress />}</div>;
};
