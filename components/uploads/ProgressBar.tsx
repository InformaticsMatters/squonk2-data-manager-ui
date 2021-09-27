import React, { useState } from 'react';
import type { FileError } from 'react-dropzone';

import { useGetTask } from '@squonk/data-manager-client/task';

import { Box, LinearProgress, Typography } from '@material-ui/core';

export interface ProgressBarProps {
  /**
   * ID of the task
   */
  taskId: string | null;
  /**
   * Progress of the upload
   */
  progress: number;
  /**
   * Errors that have occurred during upload
   */
  errors: FileError[];
  /**
   * Called when the task is in the done state
   */
  onDone: () => void;
}

/**
 * File upload progress bar that display upload progress and polls a task to wait for upload
 * processing to finish.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ taskId, progress, errors, onDone }) => {
  const [interval, setInterval] = useState<number | false>(2000);
  const { data: task, isLoading } = useGetTask(taskId ?? '', undefined, {
    query: {
      // Poll the task until the task is done
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
    <Box paddingTop={1}>
      {task === undefined && progress < 100 && (
        <LinearProgress value={progress} variant="determinate" />
      )}
      {!isLoading && task && !task.done && <LinearProgress />}
      {errors.map((error, index) => (
        <Typography color="error" key={`${error.code}-${error.message}-${index}`}>
          {error.message}
        </Typography>
      ))}
    </Box>
  );
};
