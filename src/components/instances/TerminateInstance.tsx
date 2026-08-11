import { type DmError } from "@/api/data-manager";

import { Button } from "@mui/material";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { capabilityIsEnabled, type ProjectCapability } from "../../projects/capabilities";
import {
  type ResultInstanceLifecycle,
  resultInstanceTerminationAction,
} from "../../projects/instanceFacts";
import { useResultCommands } from "../../projects/useResultCommands";
import { WarningDeleteButton } from "../WarningDeleteButton";

export interface TerminateInstanceProps {
  /** What the caller may do with this instance, decided by the concrete instance and its project. */
  capability: ProjectCapability;
  instanceId: string;
  /** The concrete instance's own progress, which decides what this control says it will do. */
  lifecycle: ResultInstanceLifecycle;
  /**
   * The project the instance itself declares it belongs to, so the command refreshes that
   * project's own collection rather than every project's.
   */
  projectId: string;
  /** Called once the Data Manager has accepted the request; a rejection never calls it. */
  onRemoved?: () => void;
}

/**
 * Stops one instance of the project that owns it, or deletes it once it has finished. The Data
 * Manager takes one request for both and it removes the instance either way, so what the control
 * names is what the caller is losing: work that is still running, or a result that has finished.
 * An instance whose progress could not be established can be told neither, so it is offered
 * neither. The command owner refreshes that project's instance collection and this instance alone,
 * and a rejection is reported where the instance is rather than leaving the project or the route it
 * was rejected in.
 */
export const TerminateInstance = ({
  capability,
  instanceId,
  lifecycle,
  projectId,
  onRemoved,
}: TerminateInstanceProps) => {
  const commands = useResultCommands();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const action = resultInstanceTerminationAction(lifecycle);
  // Only an instance that accounted for having finished is named as a result to delete. Anything
  // else is named as work to stop, so an instance this client cannot place is never presented with
  // an irreversible action whose effect it cannot name.
  const done = action === "delete";
  const verb = done ? "Delete" : "Terminate";

  return (
    <WarningDeleteButton
      modalId={`delete-instance-${instanceId}`}
      submitText={verb}
      title={`${verb} Instance`}
      tooltipText={`${verb} this instance`}
      onDelete={async () => {
        try {
          await commands.terminateInstance(projectId, instanceId);
          enqueueSnackbar(`Instance has been ${done ? "deleted" : "terminated"}`, {
            variant: "success",
          });
          onRemoved?.();
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
