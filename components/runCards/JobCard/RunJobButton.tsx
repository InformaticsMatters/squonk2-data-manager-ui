import { useState } from "react";

import { type JobSummary } from "@squonk/data-manager-client";

import { Button, CircularProgress, Tooltip } from "@mui/material";
import dynamic from "next/dynamic";

import { type JobModalProps } from "./JobModal";

export interface RunJobButtonProps extends Pick<JobModalProps, "jobId" | "onLaunch" | "projectId"> {
  disabled: JobSummary["disabled"];
}

const JobModal = dynamic<JobModalProps>(() => import("./JobModal").then((mod) => mod.JobModal), {
  loading: () => <CircularProgress size="1rem" />,
});

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
      {!!hasOpened && (
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
