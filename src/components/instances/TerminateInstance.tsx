import { type DmError, type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";

import { Button } from "@mui/material";

import { INSTANCE_DONE_PHASES } from "../../constants/results";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { useResultCommands } from "../../projects/useResultCommands";
import { WarningDeleteButton } from "../WarningDeleteButton";

export interface TerminateInstanceProps {
  /**
   * Instance to terminate
   */
  instanceId: InstanceSummary["id"];
  phase: InstanceGetResponse["phase"] | InstanceSummary["phase"];
  projectId: InstanceGetResponse["project_id"] | InstanceSummary["project_id"];
  disabled?: boolean;
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
  disabled = false,
}: TerminateInstanceProps) => {
  const commands = useResultCommands();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const done = INSTANCE_DONE_PHASES.includes(phase);

  const verb = done ? "Delete" : "Terminate";

  return (
    <WarningDeleteButton
      modalId={`delete-instance-${instanceId}`}
      submitText={verb}
      title={verb + " Instance"}
      tooltipText={verb + " this instance"}
      onDelete={async () => {
        try {
          await commands.terminateInstance(projectId, instanceId);
          enqueueSnackbar(`Instance has been ${done ? "deleted" : "terminated"}`, {
            variant: "success",
          });
        } catch (error) {
          enqueueError(error);
        }

        onTermination?.();
      }}
    >
      {({ openModal }) => (
        <Button disabled={disabled} onClick={openModal}>
          {/* Instances in an end state are deleted but others are still running so are terminated.
          It's all the same to the API though. */}
          {verb}
        </Button>
      )}
    </WarningDeleteButton>
  );
};
