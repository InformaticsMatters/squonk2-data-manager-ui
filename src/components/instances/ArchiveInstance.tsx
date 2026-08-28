import { useState } from "react";

import { type DmError } from "@/api/data-manager";

import { Button, Tooltip } from "@mui/material";

import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { capabilityIsEnabled, type ProjectCapability } from "../../projects/capabilities";
import { useResultCommands } from "../../projects/useResultCommands";
import { settle } from "../../utils/app/settle";

export interface ArchiveInstanceProps {
  archived: boolean;
  /**
   * What the caller may do with this instance, decided by the project that owns it. Archiving only
   * protects an instance from automatic deletion and is reversible, so it answers to that project
   * alone rather than to what the instance's own progress could establish.
   */
  capability: ProjectCapability;
  instanceId: string;
  /**
   * The project the instance itself declares it belongs to, so the command refreshes that
   * project's own collection rather than every project's.
   */
  projectId: string;
}

/**
 * Protects one instance of the project that owns it from automatic deletion, or gives up that
 * protection. A rejection is reported where the instance is and changes neither the project nor
 * the route it was rejected in.
 */
export const ArchiveInstance = ({
  archived,
  capability,
  instanceId,
  projectId,
}: ArchiveInstanceProps) => {
  const commands = useResultCommands();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();
  const [archiving, setArchiving] = useState(false);

  const archiveInstance = async () => {
    setArchiving(true);
    const outcome = await settle(() => commands.archiveInstance(projectId, instanceId, !archived));
    setArchiving(false);
    if (outcome.ok) {
      enqueueSnackbar(`Instance has been ${archived ? "unarchived" : "archived"}`, {
        variant: "success",
      });
    } else {
      enqueueError(outcome.error);
    }
  };

  return (
    <Tooltip title="Toggle whether an instance will be deleted automatically">
      <span>
        <Button
          disabled={archiving || !capabilityIsEnabled(capability)}
          onClick={() => void archiveInstance()}
        >
          {archived ? "Unarchive" : "Archive"}
        </Button>
      </span>
    </Tooltip>
  );
};
