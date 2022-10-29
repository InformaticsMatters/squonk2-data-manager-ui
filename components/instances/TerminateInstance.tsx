import type { DmError, InstanceGetResponse, InstanceSummary } from "@squonk/data-manager-client";
import {
  getGetInstancesQueryKey,
  useTerminateInstance,
} from "@squonk/data-manager-client/instance";

import { Button } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { DONE_PHASES } from "../../constants/instances";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { WarningDeleteButton } from "../WarningDeleteButton";

export interface TerminateInstanceProps {
  /**
   * Instance to terminate
   */
  instanceId: InstanceSummary["id"];
  phase: InstanceSummary["phase"] | InstanceGetResponse["phase"];
  projectId: InstanceSummary["project_id"] | InstanceGetResponse["project_id"];
  /**
   * Called when the delete request is successfully made
   */
  onTermination?: () => void;
}

export const TerminateInstance = ({
  instanceId,
  phase,
  projectId,
  onTermination,
}: TerminateInstanceProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: terminateInstance } = useTerminateInstance();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  return (
    <WarningDeleteButton
      modalId={`delete-instance-${instanceId}`}
      title="Delete Instance"
      tooltipText="Terminate this instance"
      onDelete={async () => {
        try {
          await terminateInstance({ instanceId });
          queryClient.invalidateQueries(getGetInstancesQueryKey());
          queryClient.invalidateQueries(getGetInstancesQueryKey({ project_id: projectId }));

          enqueueSnackbar("Instance has been terminated", { variant: "success" });
        } catch (error) {
          enqueueError(error);
        }

        onTermination && onTermination();
      }}
    >
      {({ openModal }) => (
        <Button onClick={openModal}>
          {/* Instances in an end state are deleted but others are still running so are terminated.
          It's all the same to the API though. */}
          {DONE_PHASES.includes(phase) ? "Delete" : "Terminate"}
        </Button>
      )}
    </WarningDeleteButton>
  );
};
