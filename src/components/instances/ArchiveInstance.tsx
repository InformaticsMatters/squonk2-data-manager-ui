import { useState } from "react";

import { type InstanceSummary } from "@/api/data-manager";

import { Button, Tooltip } from "@mui/material";

import { useResultCommands } from "../../projects/useResultCommands";

export interface ArchiveInstanceProps {
  instanceId: InstanceSummary["id"];
  /**
   * The project the instance itself declares it belongs to, so the command refreshes that
   * project's own collection rather than every project's.
   */
  projectId: string;
  archived: boolean;
  disabled?: boolean;
}

export const ArchiveInstance = ({
  instanceId,
  projectId,
  archived,
  disabled = false,
}: ArchiveInstanceProps) => {
  const commands = useResultCommands();
  const [archiving, setArchiving] = useState(false);

  const archiveInstance = async () => {
    setArchiving(true);
    try {
      await commands.archiveInstance(projectId, instanceId, !archived);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Tooltip title="Toggle whether an instance will be deleted automatically">
      <span>
        <Button disabled={archiving || disabled} onClick={() => void archiveInstance()}>
          {archived ? "Unarchive" : "Archive"}
        </Button>
      </span>
    </Tooltip>
  );
};
