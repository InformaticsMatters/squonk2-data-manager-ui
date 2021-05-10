import React, { useState } from 'react';

import { FileError } from 'react-dropzone';

import { LinearProgress, Typography } from '@material-ui/core';
import { Task, useGetTask } from '@squonk/data-manager-client';

interface ProgressBarProps {
  taskId: string | null;
  progress: number;
  errors: FileError[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ taskId, progress, errors }) => {
  const [interval, setInterval] = useState<number | false>(2000);
  const { data, isLoading } = useGetTask(taskId ?? '', undefined, {
    query: {
      refetchInterval: interval,
      onSuccess: () => {
        if (!isLoading && task && task.done) {
          setInterval(false);
        }
      },
    },
  });
  const task = data as Task;

  return (
    <>
      {progress < 100 && <LinearProgress variant="determinate" value={progress} />}
      {!isLoading && task && !task.done && <LinearProgress />}
      {errors.map((error, index) => (
        <Typography key={`${error.code}-${error.message}-${index}`} color="error">
          {error.message}
        </Typography>
      ))}
    </>
  );
};
