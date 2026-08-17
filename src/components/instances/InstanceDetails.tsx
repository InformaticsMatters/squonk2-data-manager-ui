import { Alert, Button } from "@mui/material";

import { useResultInstance } from "../../projects/useResultInstance";
import { CenterLoader } from "../CenterLoader";
import { InstanceProgress } from "./InstanceProgress";

export interface InstanceDetailsProps {
  instanceId: string;
  /** The project the instance is addressed beneath; nothing is read past one it disowns. */
  projectId: string;
}

/**
 * Displays what one listed instance did. The instance is read and polled by the one owner of the
 * addressed instance read, so an instance expanded in a list and the same instance on its own route
 * are never fetched, polled, or refreshed differently.
 */
export const InstanceDetails = ({ instanceId, projectId }: InstanceDetailsProps) => {
  const read = useResultInstance(instanceId, projectId);
  const handleRetry = () => read.refetch();

  if (read.readState.kind === "unavailable") {
    return <Alert severity="warning">This instance is no longer available.</Alert>;
  }
  if (read.instance === undefined) {
    return read.readState.kind === "recoverable" ? (
      <Alert
        action={
          <Button color="inherit" size="small" onClick={handleRetry}>
            Retry
          </Button>
        }
        severity="error"
      >
        This instance could not be read.
      </Alert>
    ) : (
      <CenterLoader />
    );
  }

  return <InstanceProgress instance={read.instance} lifecycle={read.lifecycle} />;
};
