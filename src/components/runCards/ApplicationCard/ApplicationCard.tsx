import { type ApplicationSummary, type InstanceSummary } from "@/api/data-manager";

import { Typography } from "@mui/material";

import { type RunState } from "../../../projects/routes";
import { type RunCapabilities } from "../../../projects/runCapabilities";
import { BaseCard } from "../../BaseCard";
import { CapabilityReasons } from "../../results/CapabilityReasons";
import { InstancesList } from "../InstancesList";
import { RunDefinitionButton } from "../RunDefinitionButton";

export interface ApplicationCardProps {
  /**
   * The application definition to display
   */
  application: ApplicationSummary;
  /** This application's existing instances inside the project that owns them. */
  instances: readonly InstanceSummary[];
  /** Those instances are still being listed, so the card cannot say it has none. */
  isLoading?: boolean;
  projectId: string;
  /** What the project in the URL decides about the definition this card addresses. */
  resolveCapabilities: (definitionId: string) => RunCapabilities;
  runState: RunState;
}

/**
 * MuiCard that displays a summary of an application, linking to its own canonical definition
 * route and listing the instances the addressed project already has of it.
 */
export const ApplicationCard = ({
  application,
  instances,
  isLoading,
  projectId,
  resolveCapabilities,
  runState,
}: ApplicationCardProps) => (
  <BaseCard
    accentColor="secondary.dark"
    actions={
      <>
        <CapabilityReasons
          capabilities={[resolveCapabilities(application.application_id).launch]}
        />
        <RunDefinitionButton
          definitionId={application.application_id}
          definitionLabel={application.kind}
          definitionType="applications"
          projectId={projectId}
          runState={runState}
        />
      </>
    }
    collapsed={<InstancesList instances={instances} isLoading={isLoading} />}
    header={{ title: application.kind, subtitle: application.group, avatar: application.kind[0] }}
  >
    <Typography
      sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold" }}
      variant="caption"
    >
      Application
    </Typography>
  </BaseCard>
);
