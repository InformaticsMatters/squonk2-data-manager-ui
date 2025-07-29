import { RunningWorkflowGetResponseStatus } from "@squonk/data-manager-client";
import {
  getGetRunningWorkflowQueryKey,
  getGetRunningWorkflowsQueryKey,
  useDeleteRunningWorkflow,
} from "@squonk/data-manager-client/workflow";

import { Button } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { WORKFLOW_DONE_PHASES } from "../constants/results";
import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { WarningDeleteButton } from "./WarningDeleteButton";

interface TerminateWorkflowButtonProps {
  runningWorkflowId: string;
  status?: RunningWorkflowGetResponseStatus;
  disabled?: boolean;
}

export const TerminateWorkflowButton = ({
  runningWorkflowId,
  status,
  disabled = false,
}: TerminateWorkflowButtonProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteWorkflow } = useDeleteRunningWorkflow();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();

  const done = WORKFLOW_DONE_PHASES.includes(status ?? RunningWorkflowGetResponseStatus.RUNNING);

  const verb = done ? "Delete" : "Terminate";

  const handleTerminate = async () => {
    try {
      await deleteWorkflow({ runningWorkflowId });
      void queryClient.invalidateQueries({
        queryKey: getGetRunningWorkflowQueryKey(runningWorkflowId),
      });
      void queryClient.invalidateQueries({ queryKey: getGetRunningWorkflowsQueryKey() });
      enqueueSnackbar(`Workflow has been ${done ? "deleted" : "terminated"}`, {
        variant: "success",
      });
    } catch (error) {
      enqueueError(error);
    }
  };

  return (
    <WarningDeleteButton
      modalId={`terminate-workflow-${runningWorkflowId}`}
      submitText={verb}
      title={`${verb} Workflow`}
      tooltipText={`${verb} this workflow`}
      onDelete={handleTerminate}
    >
      {({ openModal }) => (
        <Button disabled={disabled} onClick={openModal}>
          {verb}
        </Button>
      )}
    </WarningDeleteButton>
  );
};
