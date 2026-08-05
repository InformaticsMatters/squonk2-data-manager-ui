import { RunningWorkflowGetResponseStatus } from "@/api/data-manager";

import { Button } from "@mui/material";

import { WORKFLOW_DONE_PHASES } from "../constants/results";
import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { useResultCommands } from "../projects/useResultCommands";
import { WarningDeleteButton } from "./WarningDeleteButton";

interface DeleteWorkflowButtonProps {
  runningWorkflowId: string;
  /**
   * The project the running workflow itself declares it belongs to, so the command refreshes that
   * project's own collection rather than every project's.
   */
  projectId: string;
  status?: RunningWorkflowGetResponseStatus;
  disabled?: boolean;
}

export const DeleteWorkflowButton = ({
  runningWorkflowId,
  projectId,
  status,
  disabled = false,
}: DeleteWorkflowButtonProps) => {
  const commands = useResultCommands();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  const done = WORKFLOW_DONE_PHASES.includes(status ?? RunningWorkflowGetResponseStatus.RUNNING);

  const verb = done ? "Delete" : "Stop";

  const handleClick = async () => {
    try {
      await commands.endRunningWorkflow(projectId, runningWorkflowId, done);
      enqueueSnackbar(`Workflow has been ${done ? "deleted" : "stopped"}`, { variant: "success" });
    } catch (error) {
      enqueueError(error);
    }
  };

  return (
    <WarningDeleteButton
      modalId={`stop-workflow-${runningWorkflowId}`}
      submitText={verb}
      title={`${verb} Workflow`}
      tooltipText={`${verb} this workflow`}
      onDelete={handleClick}
    >
      {({ openModal }) => (
        <Button disabled={disabled} onClick={openModal}>
          {verb}
        </Button>
      )}
    </WarningDeleteButton>
  );
};
