import { useState } from "react";

import { type InstanceSummary } from "@/api/data-manager";
import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  usePatchInstance,
} from "@/api/data-manager/instance";

import { Button, Tooltip } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

export interface ArchiveInstanceProps {
  instanceId: InstanceSummary["id"];
  archived: boolean;
}

export const ArchiveInstance = ({ instanceId, archived }: ArchiveInstanceProps) => {
  const { mutateAsync: patchInstance } = usePatchInstance();
  const queryClient = useQueryClient();
  const [archiving, setArchiving] = useState(false);

  const archiveInstance = async () => {
    setArchiving(true);
    await patchInstance({ instanceId, params: { archive: !archived } });
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: getGetInstanceQueryKey(instanceId) }),
      queryClient.invalidateQueries({ queryKey: getGetInstancesQueryKey() }),
    ]);
    setArchiving(false);
  };

  return (
    <Tooltip title="Toggle whether an instance will be deleted automatically">
      <span>
        <Button disabled={archiving} onClick={() => void archiveInstance()}>
          {archived ? "Unarchive" : "Archive"}
        </Button>
      </span>
    </Tooltip>
  );
};
