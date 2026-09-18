import { type TaskGetResponse } from "@/api/data-manager";

import { Alert, Grid, Typography } from "@mui/material";

import { type ResultTaskLifecycle } from "../../projects/taskFacts";
import { TimeLine } from "./TimeLine";

/**
 * What the task's own read last said about its progress. A task that failed says so with the Data
 * Manager's own words, a read that could not be made says that instead of an outcome, and neither
 * is ever presented as a finished task.
 */
const TaskLifecycleAlert = ({ lifecycle }: { lifecycle: ResultTaskLifecycle }) => {
  switch (lifecycle.kind) {
    case "failed":
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {lifecycle.reason}
        </Alert>
      );
    case "unconfirmed":
    case "unknown":
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {lifecycle.reason}
        </Alert>
      );
    case "pending":
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          This task is still running.
        </Alert>
      );
    case "succeeded":
    case "unestablished":
      return null;
  }
};

export interface TaskProgressProps {
  lifecycle: ResultTaskLifecycle;
  task: Pick<TaskGetResponse, "events" | "states">;
}

/**
 * The states and events one task recorded, presented under what its lifecycle says about them.
 */
export const TaskProgress = ({ lifecycle, task }: TaskProgressProps) => (
  <>
    <TaskLifecycleAlert lifecycle={lifecycle} />
    <Grid container spacing={2}>
      <Grid size={{ sm: 4, xs: 12 }}>
        <Typography align="center" component="h3" variant="h6">
          <b>States</b>
        </Typography>
        <TimeLine states={task.states ?? []} />
      </Grid>
      <Grid size={{ sm: 8, xs: 12 }}>
        <Typography align="center" component="h3" variant="h6">
          <b>Events</b>
        </Typography>
        <TimeLine states={task.events ?? []} />
      </Grid>
    </Grid>
  </>
);
