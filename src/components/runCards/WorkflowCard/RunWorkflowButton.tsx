import { useState } from "react";

import { type WorkflowSummary } from "@squonk/data-manager-client";

import { Button, CircularProgress, Tooltip } from "@mui/material";
import dynamic from "next/dynamic";

export interface RunWorkflowButtonProps {
  workflowId: WorkflowSummary["id"];
  name: WorkflowSummary["name"];
  projectId: string;
  onLaunch?: (instanceId: string) => void;
  disabled?: boolean;
}

const WorkflowModal = dynamic<any>(
  () => import("./WorkflowModal").then((mod) => mod.WorkflowModal),
  { loading: () => <CircularProgress size="1rem" /> },
);

/**
 * MuiButton that controls a modal to run a workflow instance
 */
export const RunWorkflowButton = ({
  workflowId,
  name,
  projectId,
  onLaunch,
  disabled,
}: RunWorkflowButtonProps) => {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <>
      <Tooltip title="Run workflow">
        <span>
          <Button
            color="primary"
            disabled={disabled ?? !projectId}
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
        <WorkflowModal
          name={name}
          open={open}
          projectId={projectId}
          workflowId={workflowId}
          onClose={() => setOpen(false)}
          onLaunch={onLaunch}
        />
      )}
    </>
  );
};
