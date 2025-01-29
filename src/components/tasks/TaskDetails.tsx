import { type TaskSummary } from "@squonk/data-manager-client";

import { Grid, Typography } from "@mui/material";

import { usePolledGetTask } from "../../hooks/usePolledGetTask";
import { CenterLoader } from "../CenterLoader";
import { TimeLine } from "./TimeLine";

export interface TaskDetailsProps {
  /**
   * ID of the task
   */
  taskId: TaskSummary["id"];
}

/**
 * Displays details of a task based on a task ID
 */
export const TaskDetails = ({ taskId }: TaskDetailsProps) => {
  const { data: task } = usePolledGetTask(taskId);

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
