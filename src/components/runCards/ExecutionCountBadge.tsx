import { type ReactNode } from "react";

import { ErrorOutlined as ErrorOutlinedIcon } from "@mui/icons-material";
import { Chip, CircularProgress, Tooltip } from "@mui/material";
import A from "next/link";

import { projectLinks } from "../../projects/routes";
import {
  countRunDefinitionExecutions,
  runDefinitionExecutionFilter,
  type RunDefinitionSelection,
  runExecutionCountStatement,
  type RunExecutions,
} from "../../projects/runFacts";

export interface ExecutionCountBadgeProps {
  /**
   * The collection this definition's executions are counted from, exactly as its own read left it.
   * A card is given only the collection it counts, so a slow or failed read of the other one never
   * decides what this badge may say.
   */
  executions: RunExecutions;
  projectId: string;
  /**
   * The definition the card is offering, including the version selected on it where it offers one.
   * The count and the link are both built from it, so they cannot name two different definitions.
   */
  selection: RunDefinitionSelection;
}

/**
 * How many executions of one definition the addressed project has, stated on the card itself and
 * linking straight to the Results list of exactly what was counted.
 *
 * The three outcomes are distinct and none of them is spelled as the others: a number when the
 * count is known, a loading indication while the collection is still being read, and an error
 * indication when that read failed. Zero is stated only where a read that answered established it,
 * so a pending or failed read is never presented as "nothing has run".
 *
 * It stays a link in every state, including at zero: where the badge links to is decided by the
 * definition the card is offering rather than by the count, and a filtered Results page answers for
 * a definition that has never run here in its own empty state.
 */
export const ExecutionCountBadge = ({
  executions,
  projectId,
  selection,
}: ExecutionCountBadgeProps) => {
  const { filter, name, target } = runDefinitionExecutionFilter(selection);
  const count = countRunDefinitionExecutions(executions, target);
  // What the badge says is the facts module's to decide, so the number shown and the statement it
  // is announced by are one rule rather than two the card could let drift. What stands in for a
  // number there is not yet — an outstanding read and a failed one each draw their own mark.
  const { description, text } = runExecutionCountStatement(count, name);
  const drawn: ReactNode =
    text ??
    (count.status === "pending" ? (
      <CircularProgress size={14} />
    ) : (
      <ErrorOutlinedIcon color="error" fontSize="small" />
    ));

  return (
    <Tooltip title={description}>
      <Chip
        clickable
        aria-label={description}
        component={A}
        href={projectLinks.results(projectId, { definition: filter }) as never}
        label={drawn}
        size="small"
        variant="outlined"
      />
    </Tooltip>
  );
};
