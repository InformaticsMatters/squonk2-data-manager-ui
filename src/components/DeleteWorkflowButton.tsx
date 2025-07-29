import { RunningWorkflowGetResponseStatus } from "@squonk/data-manager-client";
import {
  getGetRunningWorkflowQueryKey,
  getGetRunningWorkflowsQueryKey,
  useDeleteRunningWorkflow,
  useStopRunningWorkflow,
} from "@squonk/data-manager-client/workflow";

import { Button } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { WORKFLOW_DONE_PHASES } from "../constants/results";
import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { WarningDeleteButton } from "./WarningDeleteButton";

interface DeleteWorkflowButtonProps {
  runningWorkflowId: string;
  status?: RunningWorkflowGetResponseStatus;
  disabled?: boolean;
}

export const DeleteWorkflowButton = ({
  runningWorkflowId,
  status,
  disabled = false,
}: DeleteWorkflowButtonProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteWorkflow } = useDeleteRunningWorkflow();
  const { mutateAsync: stopWorkflow } = useStopRunningWorkflow();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  const done = WORKFLOW_DONE_PHASES.includes(status ?? RunningWorkflowGetResponseStatus.RUNNING);

  const verb = done ? "Delete" : "Stop";

  const handleClick = async () => {
    try {
      await (done ? deleteWorkflow({ runningWorkflowId }) : stopWorkflow({ runningWorkflowId }));
      enqueueSnackbar(`Workflow has been ${done ? "deleted" : "stopped"}`, { variant: "success" });
    } catch (error) {
      enqueueError(error);
    } finally {
      void queryClient.invalidateQueries({
        queryKey: getGetRunningWorkflowQueryKey(runningWorkflowId),
      });
      void queryClient.invalidateQueries({ queryKey: getGetRunningWorkflowsQueryKey() });
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
