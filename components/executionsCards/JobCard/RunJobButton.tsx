import { useState } from "react";

import type { JobSummary } from "@squonk/data-manager-client";

import { Button, Tooltip } from "@mui/material";

import type { JobModalProps } from "./JobModal";
import { JobModal } from "./JobModal";

export interface RunJobButtonProps extends Pick<JobModalProps, "jobId" | "onLaunch" | "projectId"> {
  disabled: JobSummary["disabled"];
}

/**
 * MuiButton that control a modal with options to create a new instance of a job
 */
export const RunJobButton = ({ projectId, jobId, disabled, onLaunch }: RunJobButtonProps) => {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <>
      <Tooltip title="Run job">
        <span>
          <Button
            color="primary"
            disabled={disabled || !projectId}
            onClick={() => {
              setOpen(true);
              setHasOpened(true);
            }}
          >
            Run
          </Button>
        </span>
      </Tooltip>
      {hasOpened && (
        <JobModal
          jobId={jobId}
          open={open}
          projectId={projectId}
          onClose={() => setOpen(false)}
          onLaunch={onLaunch}
        />
      )}
    </>
  );
};
