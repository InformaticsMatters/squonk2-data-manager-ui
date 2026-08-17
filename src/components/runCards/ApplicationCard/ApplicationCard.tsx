import { type ApplicationSummary, type InstanceSummary } from "@/api/data-manager";

import { Typography } from "@mui/material";

import { type RunState } from "../../../projects/routes";
import { BaseCard } from "../../BaseCard";
import { InstancesList } from "../InstancesList";
import { RunDefinitionButton } from "../RunDefinitionButton";

export interface ApplicationCardProps {
  /**
   * The application definition to display
   */
  application: ApplicationSummary;
  /** The read listing this project's instances has not answered yet. */
  executionsLoading?: boolean;
  /** This application's existing instances inside the project that owns them. */
  instances: readonly InstanceSummary[];
  projectId: string;
  runState: RunState;
}

/**
 * MuiCard that displays a summary of an application, linking to its own canonical definition
 * route and listing the instances the addressed project already has of it.
 *
 * What running this definition requires is not stated here: the section states once what the
 * project requires of every definition, and the modal this card opens states what this definition
 * requires of its own accord.
 */
export const ApplicationCard = ({
  application,
  executionsLoading,
  instances,
  projectId,
  runState,
}: ApplicationCardProps) => (
  <BaseCard
    accentColor="secondary.dark"
    actions={
      <RunDefinitionButton
        definitionId={application.application_id}
        definitionLabel={application.kind}
        definitionType="applications"
        projectId={projectId}
        runState={runState}
      />
    }
    collapsed={<InstancesList instances={instances} isLoading={executionsLoading} />}
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
