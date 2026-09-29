import { type TaskSummary } from "@/api/data-manager";

import { Alert, Button } from "@mui/material";

import { useResultTask } from "../../projects/useResultTask";
import { CenterLoader } from "../CenterLoader";
import { TaskProgress } from "./TaskProgress";

export interface TaskDetailsProps {
  /**
   * ID of the task
   */
  taskId: TaskSummary["id"];
}

/**
 * Displays the progress of one listed task. The task is read and polled by the one owner of the
 * addressed task read, so a task expanded in a list and the same task on its own route are never
 * fetched, polled, or refreshed differently.
 */
export const TaskDetails = ({ taskId }: TaskDetailsProps) => {
  const read = useResultTask(taskId);
  const handleRetry = () => read.refetch();

  if (read.readState.kind === "unavailable") {
    return <Alert severity="warning">This task&apos;s progress is no longer available.</Alert>;
  }
  if (read.task === undefined) {
    return read.readState.kind === "recoverable" ? (
      <Alert
        action={
          <Button color="inherit" size="small" onClick={handleRetry}>
            Retry
          </Button>
        }
        severity="error"
      >
        This task&apos;s progress could not be read.
      </Alert>
    ) : (
      <CenterLoader />
    );
  }

  return <TaskProgress lifecycle={read.lifecycle} task={read.task} />;
};
