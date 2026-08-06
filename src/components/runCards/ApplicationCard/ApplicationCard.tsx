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
  capabilities: RunCapabilities;
  /** This application's existing instances inside the project that owns them. */
  instances: readonly InstanceSummary[];
  projectId: string;
  runState: RunState;
}

/**
 * MuiCard that displays a summary of an application, linking to its own canonical definition
 * route and listing the instances the addressed project already has of it.
 */
export const ApplicationCard = ({
  application,
  capabilities,
  instances,
  projectId,
  runState,
}: ApplicationCardProps) => (
  <BaseCard
    accentColor="secondary.dark"
    actions={
      <>
        <CapabilityReasons capabilities={[capabilities.launch]} />
        <RunDefinitionButton
          definitionId={application.application_id}
          definitionLabel={application.kind}
          definitionType="applications"
          projectId={projectId}
          runState={runState}
        />
      </>
    }
    collapsed={<InstancesList instances={instances} />}
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
