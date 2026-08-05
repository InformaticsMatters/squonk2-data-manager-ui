import { type DmError, type TaskSummary } from "@/api/data-manager";

import { Button, CardContent } from "@mui/material";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { capabilityIsEnabled } from "../../projects/capabilities";
import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { useResultCommands } from "../../projects/useResultCommands";
import { CapabilityReasons } from "../results/CapabilityReasons";
import { ResultCard } from "../results/ResultCard";
import { WarningDeleteButton } from "../WarningDeleteButton";
import { TaskDetails } from "./TaskDetails";

export interface ResultTaskCardProps {
  /**
   * The task which will be displayed
   */
  task: TaskSummary;
  /**
   * The project this task was read under. A task resource declares no project of its own, so its
   * project-constrained list request is its only ownership fact.
   */
  projectId: string;
  /**
   * What the caller may do with this task in that project.
   */
  capabilities: ResultCapabilities;
  /**
   * Results list state this card's links preserve.
   */
  resultsState?: ResultsState;
  /**
   * Whether the card should have its collapsed content visible immediately. Defaults to true.
   */
  collapsedByDefault?: boolean;
}

/**
 * Expandable card that displays details about a task
 */
export const ResultTaskCard = ({
  task,
  projectId,
  capabilities,
  resultsState,
  collapsedByDefault = true,
}: ResultTaskCardProps) => {
  const commands = useResultCommands();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  return (
    <ResultCard
      actions={({ setSlideIn }) => (
        <>
          <WarningDeleteButton
            modalId={`delete-task-${task.id}`}
            title="Delete Task"
            tooltipText="Delete Task"
            onDelete={async () => {
              try {
                await commands.deleteResultTask(projectId, task.id);
                enqueueSnackbar("Task successfully deleted", { variant: "success" });
              } catch (error) {
                enqueueError(error);
              } finally {
                setSlideIn(false);
              }
            }}
          >
            {({ openModal }) => (
              <Button
                disabled={!capabilityIsEnabled(capabilities.taskDeletion)}
                onClick={openModal}
              >
                Delete
              </Button>
            )}
          </WarningDeleteButton>
          <CapabilityReasons capabilities={[capabilities.taskDeletion]} />
        </>
      )}
      collapsed={
        <CardContent>
          <TaskDetails taskId={task.id} />
        </CardContent>
      }
      collapsedByDefault={collapsedByDefault}
      createdDateTime={task.created}
      href={projectLinks.result(projectId, "tasks", task.id, resultsState)}
      linkTitle={task.purpose}
      showDuration={false}
      state={task.processing_stage}
    />
  );
};
