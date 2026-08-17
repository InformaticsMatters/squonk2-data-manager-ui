import { type WorkflowSummary } from "@/api/data-manager";

import { Typography } from "@mui/material";

import { type RunState } from "../../../projects/routes";
import { type RunExecutions } from "../../../projects/runFacts";
import { BaseCard } from "../../BaseCard";
import { ExecutionCountBadge } from "../ExecutionCountBadge";
import { RunDefinitionButton } from "../RunDefinitionButton";

export interface WorkflowCardProps {
  /** This project's running workflows, as the badge counting this definition's executions sees them. */
  executions: RunExecutions;
  projectId: string;
  runState: RunState;
  workflow: WorkflowSummary;
}

/**
 * MuiCard that displays a summary of a workflow definition, linking to its own canonical
 * definition route and counting the addressed project's running workflows of it.
 *
 * The card lists none of them itself: its badge links to the one place that lists a definition's
 * executions properly, so there is one implementation of that list rather than two.
 *
 * What running this definition requires is not stated here: the section states once what the
 * project requires of every definition, and the modal this card opens states what this definition
 * requires of its own accord.
 */
export const WorkflowCard = ({ executions, projectId, runState, workflow }: WorkflowCardProps) => (
  <BaseCard
    accentColor="#f1c40f"
    actions={
      <>
        {/* The card represents the whole definition family, so its badge counts and links to every
        running workflow started from it. */}
        <ExecutionCountBadge
          executions={executions}
          projectId={projectId}
          selection={{ kind: "workflow", workflow }}
        />
        <RunDefinitionButton
          definitionId={workflow.id}
          definitionLabel={workflow.workflow_name ?? workflow.name}
          definitionType="workflows"
          projectId={projectId}
          runState={runState}
        />
      </>
    }
    header={{
      subtitle: workflow.name,
      avatar: workflow.name[0],
      title: workflow.workflow_name ?? workflow.name,
    }}
  >
    <Typography
      sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold" }}
      variant="caption"
    >
      Workflow
    </Typography>
    <Typography gutterBottom>{workflow.workflow_description ?? <em>No description</em>}</Typography>
    <Typography gutterBottom variant="body2">
      Version: {workflow.version ?? <em>n/a</em>}
    </Typography>
  </BaseCard>
);
