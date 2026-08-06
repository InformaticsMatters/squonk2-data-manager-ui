import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";
import { useGetInstance } from "@/api/data-manager/instance";

import { Alert, Box } from "@mui/material";
import { captureException } from "@sentry/nextjs";

import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { type ResultsState } from "../../projects/routes";
import { getErrorMessage } from "../../utils/next/orvalError";
import { CenterLoader } from "../CenterLoader";
import { ResultApplicationCard } from "./ResultApplicationCard";
import { ResultJobCard } from "./ResultJobCard";

export interface InstanceProps {
  instanceId: InstanceSummary["id"];
  /**
   * The instance a caller has already resolved. Supplying it means this component never fetches
   * the instance again, and the card keeps describing it even if a later read fails.
   */
  instanceSummary?: InstanceGetResponse | InstanceSummary;
  capabilities: ResultCapabilities;
  resultsState?: ResultsState;
  collapsedByDefault?: boolean;
}

export const Instance = ({
  instanceId,
  capabilities,
  instanceSummary,
  resultsState,
  collapsedByDefault = true,
}: InstanceProps) => {
  // The instance summary is sufficient but not always provided. If only the ID is provided, the
  // instance get response is then requested and switched in.
  const { data, isLoading, error } = useGetInstance(instanceId, {
    query: { enabled: !instanceSummary },
  });

  const instance = data ?? instanceSummary;

  if (!instance && isLoading) {
    return <CenterLoader />;
  }

  // An instance a caller already resolved still describes itself, so a failed read leaves the card
  // readable rather than replacing it with an error. Whether it is safe to change is decided by
  // the capabilities it was given, not here.
  if (error && !instance) {
    return <Alert severity="error">{getErrorMessage(error)}</Alert>; // TODO
  }

  if (instance !== undefined) {
    switch (instance.application_type) {
      case "JOB":
        return (
          <Box sx={{ marginY: 1 }}>
            <ResultJobCard
              capabilities={capabilities}
              collapsedByDefault={collapsedByDefault}
              instance={instance}
              instanceId={instanceId}
              resultsState={resultsState}
            />
          </Box>
        );
      case "APPLICATION":
        return (
          <ResultApplicationCard
            capabilities={capabilities}
            collapsedByDefault={collapsedByDefault}
            instance={instance}
            instanceId={instanceId}
            resultsState={resultsState}
          />
        );
      default:
        return <Alert severity="warning">Unknown instance type</Alert>;
    }
  }

  captureException("Instance was undefined when not loading and not errored");
  return <Alert severity="warning">No data returned from the API</Alert>;
};
