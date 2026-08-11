import { type DmError } from "@/api/data-manager";

import { Button } from "@mui/material";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { capabilityIsEnabled, type ProjectCapability } from "../../projects/capabilities";
import { useResultCommands } from "../../projects/useResultCommands";
import {
  type ResultWorkflowLifecycle,
  resultWorkflowLifecycleAction,
} from "../../projects/workflowFacts";
import { WarningDeleteButton } from "../WarningDeleteButton";

export interface WorkflowLifecycleButtonProps {
  /** What the caller may do with this workflow, decided by the concrete workflow and its project. */
  capability: ProjectCapability;
  /** The concrete workflow's own progress, which decides which request this control makes. */
  lifecycle: ResultWorkflowLifecycle;
  /**
   * The project the running workflow itself declares it belongs to, so the command refreshes that
   * project's own collection rather than every project's.
   */
  projectId: string;
  runningWorkflowId: string;
  /** Called once the Data Manager has accepted the workflow's deletion; a stop never calls it. */
  onDeleted?: () => void;
}

/**
 * Stops one running workflow of the project that owns it, or deletes it once it has finished.
 * Which of the two the Data Manager will take is a fact of the concrete workflow, so a workflow
 * whose progress could not be established offers neither. The command owner refreshes that
 * project's workflow collection and this workflow alone, and a rejection is reported where the
 * workflow is rather than leaving the project or the route it was rejected in.
 */
export const WorkflowLifecycleButton = ({
  capability,
  lifecycle,
  projectId,
  runningWorkflowId,
  onDeleted,
}: WorkflowLifecycleButtonProps) => {
  const commands = useResultCommands();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const action = resultWorkflowLifecycleAction(lifecycle);
  // Only a workflow that accounted for having finished offers to be deleted. Anything else names
  // the request that does not destroy it, so a workflow this client cannot place is never
  // presented with an irreversible action it may not even take.
  const verb = action === "delete" ? "Delete" : "Stop";
  const done = action === "delete";

  return (
    <WarningDeleteButton
      modalId={`end-workflow-${runningWorkflowId}`}
      submitText={verb}
      title={`${verb} Workflow`}
      tooltipText={`${verb} this workflow`}
      onDelete={async () => {
        try {
          await commands.endRunningWorkflow(projectId, runningWorkflowId, done);
          enqueueSnackbar(`Workflow has been ${done ? "deleted" : "stopped"}`, {
            variant: "success",
          });
          if (done) {
            onDeleted?.();
          }
        } catch (error) {
          enqueueError(error);
        }
      }}
    >
      {({ openModal }) => (
        <Button
          disabled={action === undefined || !capabilityIsEnabled(capability)}
          onClick={openModal}
        >
          {verb}
        </Button>
      )}
    </WarningDeleteButton>
  );
};
