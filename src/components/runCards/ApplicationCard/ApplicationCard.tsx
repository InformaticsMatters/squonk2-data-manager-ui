import { type ApplicationSummary } from "@/api/data-manager";

import { Typography } from "@mui/material";

import { type RunState } from "../../../projects/routes";
import { type RunExecutions } from "../../../projects/runFacts";
import { BaseCard } from "../../BaseCard";
import { ExecutionCountBadge } from "../ExecutionCountBadge";
import { RunDefinitionButton } from "../RunDefinitionButton";

export interface ApplicationCardProps {
  /**
   * The application definition to display
   */
  application: ApplicationSummary;
  /** This project's instances, as the badge counting this application's executions sees them. */
  executions: RunExecutions;
  projectId: string;
  runState: RunState;
}

/**
 * MuiCard that displays a summary of an application, linking to its own canonical definition
 * route and counting the instances the addressed project already has of it.
 *
 * The card lists none of them itself: its badge links to the one place that lists a definition's
 * executions properly, so there is one implementation of that list rather than two.
 *
 * What running this definition requires is not stated here: the section states once what the
 * project requires of every definition, and the modal this card opens states what this definition
 * requires of its own accord.
 */
export const ApplicationCard = ({
  application,
  executions,
  projectId,
  runState,
}: ApplicationCardProps) => (
  <BaseCard
    accentColor="secondary.dark"
    actions={
      <>
        {/* The card represents the whole application, so its badge counts and links to every
        instance of it. */}
        <ExecutionCountBadge
          executions={executions}
          projectId={projectId}
          selection={{ kind: "application", application }}
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
