import { type InstanceSummary } from "@squonk/data-manager-client";
import { useGetInstance } from "@squonk/data-manager-client/instance";

import { Alert, Box } from "@mui/material";
import { captureException } from "@sentry/nextjs";

import { getErrorMessage } from "../../utils/next/orvalError";
import { CenterLoader } from "../CenterLoader";
import { type ProjectListItemProps } from "../projects/ProjectListItem";
import { ResultApplicationCard } from "./ResultApplicationCard";
import { ResultJobCard } from "./ResultJobCard";

export interface InstanceProps {
  instanceId: InstanceSummary["id"];
  instanceSummary?: InstanceSummary;
  projectClickAction: ProjectListItemProps["clickAction"];
  collapsedByDefault?: boolean;
}

export const Instance = ({
  instanceId,
  projectClickAction,
  instanceSummary,
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

  if (error) {
    return <Alert severity="error">{getErrorMessage(error)}</Alert>; // TODO
  }

  if (instance !== undefined) {
    switch (instance.application_type) {
      case "JOB":
        return (
          <Box marginY={1}>
            <ResultJobCard
              collapsedByDefault={collapsedByDefault}
              instance={instance}
              instanceId={instanceId}
              projectClickAction={projectClickAction}
            />
          </Box>
        );
      case "APPLICATION":
        return (
          <ResultApplicationCard
            collapsedByDefault={collapsedByDefault}
            instance={instance}
            instanceId={instanceId}
            projectClickAction={projectClickAction}
          />
        );
      default:
        return <Alert severity="warning">Unknown instance type</Alert>;
    }
  }

  captureException("Instance was undefined when not loading and not errored");
  return <Alert severity="warning">No data returned from the API</Alert>;
};
