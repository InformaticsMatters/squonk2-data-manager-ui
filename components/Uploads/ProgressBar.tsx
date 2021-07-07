import React, { useState } from 'react';

import { FileError } from 'react-dropzone';

import { LinearProgress, Typography } from '@material-ui/core';
import { useGetTask } from '@squonk/data-manager-client/task';

interface ProgressBarProps {
  taskId: string | null;
  progress: number;
  errors: FileError[];
  onDone: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ taskId, progress, errors, onDone }) => {
  const [interval, setInterval] = useState<number | false>(2000);
  const { data: task, isLoading } = useGetTask(taskId ?? '', undefined, {
    query: {
      refetchInterval: interval,
      onSuccess: (task) => {
        if (!isLoading && task.done) {
          setInterval(false);
          onDone();
        }
      },
    },
  });

  return (
    <>
      {task === undefined && progress < 100 && (
        <LinearProgress value={progress} variant="determinate" />
      )}
      {!isLoading && task && !task.done && <LinearProgress />}
      {errors.map((error, index) => (
        <Typography color="error" key={`${error.code}-${error.message}-${index}`}>
          {error.message}
        </Typography>
      ))}
    </>
  );
};
