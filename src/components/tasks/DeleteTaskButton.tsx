import { type DmError } from "@/api/data-manager";

import { Button } from "@mui/material";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { capabilityIsEnabled, type ProjectCapability } from "../../projects/capabilities";
import { useResultCommands } from "../../projects/useResultCommands";
import { WarningDeleteButton } from "../WarningDeleteButton";

export interface DeleteTaskButtonProps {
  /** What the caller may do with this task, decided by the concrete task and its project. */
  capability: ProjectCapability;
  /**
   * The project the task was read under. A task resource declares no project of its own, so its
   * project-constrained list request is its only ownership fact.
   */
  projectId: string;
  taskId: string;
  /** Called once the Data Manager has accepted the deletion; a rejection never calls it. */
  onDeleted?: () => void;
}

/**
 * Deletes one task of the project that owns it. The command owner refreshes that project's task
 * collection and this task alone, and a rejection is reported where the task is rather than
 * leaving the project or the route it was rejected in.
 */
export const DeleteTaskButton = ({
  capability,
  projectId,
  taskId,
  onDeleted,
}: DeleteTaskButtonProps) => {
  const commands = useResultCommands();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  return (
    <WarningDeleteButton
      modalId={`delete-task-${taskId}`}
      title="Delete Task"
      tooltipText="Delete Task"
      onDelete={async () => {
        try {
          await commands.deleteResultTask(projectId, taskId);
          enqueueSnackbar("Task successfully deleted", { variant: "success" });
          onDeleted?.();
        } catch (error) {
          enqueueError(error);
        }
      }}
    >
      {({ openModal }) => (
        <Button disabled={!capabilityIsEnabled(capability)} onClick={openModal}>
          Delete
        </Button>
      )}
    </WarningDeleteButton>
  );
};
