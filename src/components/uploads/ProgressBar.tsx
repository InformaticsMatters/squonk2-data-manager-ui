import { useEffect, useState } from "react";
import { type FileError } from "react-dropzone";

import { useGetTask } from "@squonk/data-manager-client/task";

import { Box, LinearProgress, Typography } from "@mui/material";

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
export const ProgressBar = ({ taskId, progress, errors, onDone }: ProgressBarProps) => {
  const [interval, setInterval] = useState<number | false>(2000);
  const { data: task, isLoading } = useGetTask(taskId ?? "", undefined, {
    query: {
      // Poll the task until the task is done
      refetchInterval: interval,
    },
  });

  useEffect(() => {
    if (task?.done) {
      task;
      setInterval(false);
      onDone();
    }
  }, [task, onDone]);

  return (
    <Box paddingTop={1}>
      {task === undefined && progress < 100 && (
        <LinearProgress value={progress} variant="determinate" />
      )}
      {!isLoading && !!task && !task.done && <LinearProgress />}
      {errors.map((error, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Typography color="error" key={`${error.code}-${error.message}-${index}`}>
          {error.message}
        </Typography>
      ))}
    </Box>
  );
};
