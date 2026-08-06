import { useState } from "react";

import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";

import { Button } from "@mui/material";
import { useRouter } from "next/router";

import { capabilityIsEnabled, type ProjectCapability } from "../../projects/capabilities";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { JobModal } from "../runCards/JobCard/JobModal";

export interface RerunJobButtonProps {
  /**
   * Instance of the job that will be used to provide default options to rerun the job
   */
  instance: InstanceGetResponse | InstanceSummary;
  /**
   * What running this instance's job again requires, as its owning project decides it. It is the
   * only thing that decides whether the button is offered, so no caller can disable it separately.
   */
  rerun: ProjectCapability;
  /**
   * Results list state the new instance's route preserves.
   */
  resultsState?: ResultsState;
}

/**
 * Wrapper around the *execution card* job run modal that reloads defaults from an existing
 * instance. The rerun targets, and opens, the project the instance itself belongs to.
 */
export const RerunJobButton = ({ instance, rerun, resultsState }: RerunJobButtonProps) => {
  const [open, setOpen] = useState(false);

  const { push } = useRouter();
  const projectId = instance.project_id;

  // If the job id is undefined, it's probably an application which we don't currently let be rerun.
  return instance.job_id === undefined ? null : (
    <>
      <Button color="primary" disabled={!capabilityIsEnabled(rerun)} onClick={() => setOpen(true)}>
        Run again
      </Button>
      {!!open && (
        <JobModal
          capabilities={{ launch: rerun }}
          instance={instance}
          jobId={instance.job_id}
          open={open}
          projectId={projectId}
          onClose={() => setOpen(false)}
          onLaunched={(outcome) => {
            setOpen(false);
            if (outcome.kind === "instance") {
              void push(
                projectLinks.result(
                  projectId,
                  "instances",
                  outcome.instanceId,
                  resultsState,
                ) as never,
              );
            }
          }}
        />
      )}
    </>
  );
};
