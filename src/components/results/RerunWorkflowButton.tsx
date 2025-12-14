import { useMemo, useState } from "react";

import { type RunningWorkflowGetResponse } from "@squonk/data-manager-client";

import { Button } from "@mui/material";
import { useRouter } from "next/router";

import { type DebugValue } from "../runCards/DebugCheckbox";
import { WorkflowModal } from "../runCards/WorkflowCard/WorkflowModal";

export interface RerunWorkflowButtonProps {
  runningWorkflow: RunningWorkflowGetResponse;
  disabled?: boolean;
}

const normaliseDebug = (debug?: string): DebugValue => (debug === "debug" ? "debug" : "0");

const parseVariables = (variables: unknown): Record<string, unknown> | undefined => {
  if (variables === undefined || variables === null) {
    return undefined;
  }

  if (typeof variables === "string") {
    try {
      return JSON.parse(variables) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }

  return typeof variables === "object" && !Array.isArray(variables)
    ? (variables as Record<string, unknown>)
    : undefined;
};

export const RerunWorkflowButton = ({
  runningWorkflow,
  disabled = false,
}: RerunWorkflowButtonProps) => {
  const [open, setOpen] = useState(false);
  const { push } = useRouter();

  const projectId = runningWorkflow.project.id;
  const workflowId = runningWorkflow.workflow.id;

  const initialVariables = useMemo(
    () => parseVariables(runningWorkflow.variables),
    [runningWorkflow.variables],
  );

  if (!projectId || !workflowId) {
    return null;
  }

  return (
    <>
      <Button color="primary" disabled={disabled} onClick={() => setOpen(true)}>
        Run again
      </Button>
      {!!open && (
        <WorkflowModal
          initialDebug={normaliseDebug(runningWorkflow.debug)}
          initialName={runningWorkflow.name}
          initialVariables={initialVariables}
          open={open}
          projectId={projectId}
          workflowId={workflowId}
          onClose={() => setOpen(false)}
          onLaunch={(newWorkflowId) =>
            void push({
              pathname: "/results/workflow/[workflowId]",
              query: { workflowId: newWorkflowId },
            })
          }
        />
      )}
    </>
  );
};
