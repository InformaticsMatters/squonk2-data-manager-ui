import { Button } from "@mui/material";
import { useRouter } from "next/router";

import { capabilityIsEnabled, type ProjectCapability } from "../../projects/capabilities";
import { type RerunTarget } from "../../projects/resultRerun";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { RerunIcon } from "../icons";

export interface RerunButtonProps {
  /**
   * What running this result's definition again requires, as its owning project decides it. It is the
   * only thing that decides whether the button is offered, so no caller can disable it separately.
   */
  capability: ProjectCapability;
  /**
   * Results list state the rerun's route preserves, so returning from it lands on the list the
   * caller came from.
   */
  resultsState?: ResultsState;
  /** The result, the definition, and the verified project one rerun would be sent for. */
  target: RerunTarget;
}

/**
 * Opens the addressed result's rerun. The rerun is a route of that result rather than state
 * this control keeps, so it is directly linkable, survives a refresh, and is left by Back as well
 * as by Close — and it is addressed inside the one project the target was verified against.
 */
export const RerunButton = ({ capability, resultsState, target }: RerunButtonProps) => {
  const { push } = useRouter();

  return (
    <Button
      color="primary"
      disabled={!capabilityIsEnabled(capability)}
      startIcon={<RerunIcon />}
      onClick={() =>
        void push(
          projectLinks.resultRerun(
            target.projectId,
            target.collection,
            target.resultId,
            resultsState,
          ) as never,
        )
      }
    >
      Run again
    </Button>
  );
};
