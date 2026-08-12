import { Button } from "@mui/material";
import { useRouter } from "next/router";

import { capabilityIsEnabled, type ProjectCapability } from "../../projects/capabilities";
import { type RerunTarget } from "../../projects/resultRerun";
import { projectLinks, type ResultsState } from "../../projects/routes";

export interface RerunJobButtonProps {
  /**
   * What running this instance's job again requires, as its owning project decides it. It is the
   * only thing that decides whether the button is offered, so no caller can disable it separately.
   */
  capability: ProjectCapability;
  /**
   * Results list state the rerun's route preserves, so returning from it lands on the list the
   * caller came from.
   */
  resultsState?: ResultsState;
  /** The instance, the job, and the verified project one rerun would be sent for. */
  target: RerunTarget;
}

/**
 * Opens the addressed instance's rerun. The rerun is a route of that instance rather than state
 * this control keeps, so it is directly linkable, survives a refresh, and is left by Back as well
 * as by Close — and it is addressed inside the one project the target was verified against.
 */
export const RerunJobButton = ({ capability, resultsState, target }: RerunJobButtonProps) => {
  const { push } = useRouter();

  return (
    <Button
      color="primary"
      disabled={!capabilityIsEnabled(capability)}
      onClick={() =>
        void push(
          projectLinks.resultRerun(target.projectId, target.instanceId, resultsState) as never,
        )
      }
    >
      Run again
    </Button>
  );
};
