import React, { useState } from 'react';

import { useQueryClient } from 'react-query';

import { LinearProgress } from '@material-ui/core';
import { getGetInstancesQueryKey, Task, useGetTask } from '@squonk/data-manager-client';

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
  const [interval, setInterval] = useState<number | false>(10000);
  const { data, isLoading } = useGetTask(taskId ?? '', undefined, {
    refetchInterval: interval,
    onSuccess: (data) => {
      const task = data as Task | undefined;
      if (!isLoading && task && task.done) {
        setInterval(false);
        setIsTaskProcessing(false);
        queryClient.invalidateQueries(getGetInstancesQueryKey());
      }
    },
  });

  return <div>{isTaskProcessing && <LinearProgress />}</div>;
};
