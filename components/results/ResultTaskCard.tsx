import { useQueryClient } from "react-query";

import type { DmError, TaskSummary } from "@squonk/data-manager-client";
import { getGetTasksQueryKey, useDeleteTask } from "@squonk/data-manager-client/task";

import { Button, CardContent } from "@mui/material";
import { useRouter } from "next/router";

import { APP_ROUTES } from "../../constants/routes";
import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { ResultCard } from "../results/ResultCard";
import { WarningDeleteButton } from "../WarningDeleteButton";
import type { CommonProps } from "./common/types";
import type { TaskDetailsProps } from "./TaskDetails";
import { TaskDetails } from "./TaskDetails";
export interface ResultTaskCardProps extends CommonProps {
  /**
   * The task which will be displayed
   */
  task: TaskSummary;
  poll?: TaskDetailsProps["poll"];
}

/**
 * Expandable card that displays details about a task
 */
export const ResultTaskCard = ({ task, collapsedByDefault = true, poll }: ResultTaskCardProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteTask } = useDeleteTask();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const { projectId } = useCurrentProjectId();

  // Remove the parameter so it doesn't appear as a query parameter
  let { query } = useRouter();
  query = { ...query };
  delete query.taskId;

  return (
    <ResultCard
      actions={({ setSlideIn }) => (
        <WarningDeleteButton
          modalId={`delete-task-${task.id}`}
          title="Delete Task"
          tooltipText="Delete Task"
          onDelete={async () => {
            try {
              await deleteTask({ taskId: task.id });
              queryClient.invalidateQueries(getGetTasksQueryKey());
              queryClient.invalidateQueries(getGetTasksQueryKey({ project_id: projectId }));

              enqueueSnackbar("Task successfully deleted", { variant: "success" });
            } catch (error) {
              enqueueError(error);
            } finally {
              setSlideIn(false);
            }
          }}
        >
          {({ openModal }) => <Button onClick={openModal}>Delete</Button>}
        </WarningDeleteButton>
      )}
      collapsed={
        <CardContent>
          <TaskDetails poll={poll} taskId={task.id} />
        </CardContent>
      }
      collapsedByDefault={collapsedByDefault}
      createdDateTime={task.created}
      href={{
        pathname: APP_ROUTES.results.task(task.id),
        query,
      }}
      linkTitle={task.purpose}
      state={task.processing_stage}
    />
  );
};
