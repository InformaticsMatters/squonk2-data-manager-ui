import { useState } from "react";

import { type InstanceGetResponse, type InstanceSummary } from "@squonk/data-manager-client";

import { Button } from "@mui/material";
import { useRouter } from "next/router";

import { JobModal } from "../runCards/JobCard/JobModal";

export interface RerunJobButtonProps {
  /**
   * Instance of the job that will be used to provide default options to rerun the job
   */
  instance: InstanceGetResponse | InstanceSummary;
  /**
   * Whether the button is disabled
   */
  disabled: boolean;
}

/**
 * Wrapper around the *execution card* job run modal that reloads defaults from an existing instance
 */
export const RerunJobButton = ({ instance, disabled = false }: RerunJobButtonProps) => {
  const [open, setOpen] = useState(false);

  const { push } = useRouter();

  // If the job id is undefined, it's probably an application which we don't currently let be rerun.
  return instance.job_id === undefined ? null : (
    <>
      <Button color="primary" disabled={disabled} onClick={() => setOpen(true)}>
        Run again
      </Button>
      {!!open && (
        <JobModal
          instance={instance}
          jobId={instance.job_id}
          open={open}
          projectId={instance.project_id}
          onClose={() => setOpen(false)}
          onLaunch={(instanceId) =>
            void push({ pathname: "/results/instance/[instanceId]", query: { instanceId } })
          }
        />
      )}
    </>
  );
};
