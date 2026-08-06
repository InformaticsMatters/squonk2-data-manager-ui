import { Button, Tooltip } from "@mui/material";
import A from "next/link";

import { projectLinks, type RunDefinitionType, type RunState } from "../../projects/routes";

export interface RunDefinitionButtonProps {
  definitionId: string;
  /** The definition's own name, so one of many identical controls says which it opens. */
  definitionLabel: string;
  definitionType: RunDefinitionType;
  projectId: string;
  /** The catalogue state the definition route preserves, so Close and Back restore it exactly. */
  runState: RunState;
}

/**
 * Opens one definition at its own canonical route. Opening a definition is navigation rather than
 * a mutation, so it stays available to anyone who may read the project; what the definition's
 * modal then offers is decided by that project's capabilities.
 */
export const RunDefinitionButton = ({
  definitionId,
  definitionLabel,
  definitionType,
  projectId,
  runState,
}: RunDefinitionButtonProps) => {
  const label = `Run ${definitionLabel}`;

  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        color="primary"
        component={A}
        href={projectLinks.runDefinition(projectId, definitionType, definitionId, runState)}
      >
        Run
      </Button>
    </Tooltip>
  );
};
