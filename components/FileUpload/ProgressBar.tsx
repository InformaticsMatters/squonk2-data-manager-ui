import React, { useState } from 'react';

import { FileError } from 'react-dropzone';

import { LinearProgress, Typography } from '@material-ui/core';
import { useGetTask } from '@squonk/data-manager-client';

interface ProgressBarProps {
  taskId: string | null;
  progress: number;
  errors: FileError[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ taskId, progress, errors }) => {
  const [interval, setInterval] = useState<number | false>(2000);
  const { data: task, isLoading } = useGetTask(taskId ?? '', undefined, {
    query: {
      refetchInterval: interval,
      onSuccess: () => {
        if (!isLoading && task && task.done) {
          setInterval(false);
        }
      },
    },
  });

  return (
    <>
      {progress < 100 && <LinearProgress value={progress} variant="determinate" />}
      {!isLoading && task && !task.done && <LinearProgress />}
      {errors.map((error, index) => (
        <Typography color="error" key={`${error.code}-${error.message}-${index}`}>
          {error.message}
        </Typography>
      ))}
    </>
  );
};
