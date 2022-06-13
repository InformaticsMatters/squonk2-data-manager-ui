import type { TaskSummary } from "@squonk/data-manager-client";
import { useGetTask } from "@squonk/data-manager-client/task";

import { Grid, Typography } from "@mui/material";

import { CenterLoader } from "../CenterLoader";
import { TimeLine } from "./common/TimeLine";
import type { CommonDetailsProps } from "./details/JobDetails/types";

export interface TaskDetailsProps extends CommonDetailsProps {
  /**
   * ID of the task
   */
  taskId: TaskSummary["id"];
}

/**
 * Displays details of a task based on a task ID
 */
export const TaskDetails = ({ taskId, poll = false }: TaskDetailsProps) => {
  const { data: task } = useGetTask(taskId, undefined, {
    query: { refetchInterval: poll ? 5000 : undefined },
  });

  if (task === undefined) {
    return <CenterLoader />;
  }

  return (
    <Grid container spacing={2}>
      <Grid item sm={4} xs={12}>
        <Typography align="center" component="h3" variant="h6">
          <b>States</b>
        </Typography>
        <TimeLine states={task.states ?? []} />
      </Grid>
      <Grid item sm={8} xs={12}>
        <Typography align="center" component="h3" variant="h6">
          <b>Events</b>
        </Typography>
        <TimeLine states={task.events ?? []} />
      </Grid>
    </Grid>
  );
};
