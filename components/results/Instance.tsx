import type { InstanceSummary } from "@squonk/data-manager-client";
import { useGetInstance } from "@squonk/data-manager-client/instance";

import { Alert, Box } from "@mui/material";
import { captureException } from "@sentry/nextjs";

import { getErrorMessage } from "../../utils/orvalError";
import { CenterLoader } from "../CenterLoader";
import { ResultApplicationCard } from "./ResultApplicationCard";
import { ResultJobCard } from "./ResultJobCard";

export interface InstanceProps {
  instanceId: InstanceSummary["id"];
  collapsedByDefault?: boolean;
}

export const Instance = ({ instanceId, collapsedByDefault = true }: InstanceProps) => {
  const { data: instance, isLoading, error } = useGetInstance(instanceId);

  if (!instance && isLoading) {
    return <CenterLoader />;
  }

  if (error) {
    return <Alert severity="error">{getErrorMessage(error) ?? "Unknown error"}</Alert>; // TODO
  }

  if (instance !== undefined) {
    switch (instance.application_type) {
      case "JOB":
        return (
          <Box marginY={1}>
            <ResultJobCard
              poll
              collapsedByDefault={collapsedByDefault}
              instance={instance}
              instanceId={instanceId}
            />
          </Box>
        );
      case "APPLICATION":
        return (
          <ResultApplicationCard
            poll
            collapsedByDefault={collapsedByDefault}
            instance={instance}
            instanceId={instanceId}
          />
        );
      default:
        return <Alert severity="warning">Unknown instance type</Alert>;
    }
  }

  captureException("Instance was undefined when not loading and not errored");
  return <Alert severity="warning">No data returned from the API</Alert>;
};
