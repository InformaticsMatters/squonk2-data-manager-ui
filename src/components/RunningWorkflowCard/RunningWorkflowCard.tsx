import { type RunningWorkflowSummary } from "@squonk/data-manager-client";
import { useGetRunningWorkflow } from "@squonk/data-manager-client/workflow";

import { Alert } from "@mui/material";

import { useHasProjectRole } from "../../hooks/projectHooks";
import { CenterLoader } from "../CenterLoader";
import { DeleteWorkflowButton } from "../DeleteWorkflowButton";
import { RerunWorkflowButton } from "../results/RerunWorkflowButton";
import { ResultCard } from "../results/ResultCard";
import { RunningWorkflowCollapsed } from "./RunningWorkflowCollapsed";

export interface RunningWorkflowCardProps {
  runningWorkflowId: string;
  workflowSummary?: RunningWorkflowSummary;
  collapsedByDefault?: boolean;
}

function mapWorkflowStatusToState(status?: string) {
  switch (status) {
    case "RUNNING":
      return "RUNNING";
    case "SUCCESS":
      return "COMPLETED";
    case "FAILURE":
    case "USER_STOPPED":
      return "FAILED";
    default:
      return undefined;
  }
}

export const RunningWorkflowCard = ({
  runningWorkflowId,
  workflowSummary,
  collapsedByDefault = true,
}: RunningWorkflowCardProps) => {
  const { data: workflow, isLoading, error } = useGetRunningWorkflow(runningWorkflowId);

  const hasPermission = useHasProjectRole(workflow?.project.id, ["editor", "administrator"]);

  if (isLoading) {
    return <CenterLoader />;
  }
  if (error) {
    return <Alert severity="error">Failed to load workflow</Alert>;
  }

  return (
    <ResultCard
      accentColor="#f1c40f"
      actions={() => (
        <>
          {!!workflow && (
            <RerunWorkflowButton
              disabled={!hasPermission || !workflow.project.id}
              runningWorkflow={workflow}
            />
          )}
          <DeleteWorkflowButton
            disabled={!hasPermission}
            runningWorkflowId={runningWorkflowId}
            status={workflow?.status ?? workflowSummary?.status}
          />
        </>
      )}
      collapsed={<RunningWorkflowCollapsed runningWorkflowId={runningWorkflowId} />}
      collapsedByDefault={collapsedByDefault}
      createdDateTime={workflow?.started ?? workflowSummary?.started ?? ""}
      finishedDateTime={workflow?.stopped ?? workflowSummary?.stopped ?? ""}
      href={{
        pathname: "/results/workflow/[workflowId]",
        query: { workflowId: workflow?.id ?? workflowSummary?.id ?? "" },
      }}
      linkTitle={workflow?.name ?? workflowSummary?.name ?? "Workflow"}
      state={mapWorkflowStatusToState(workflow?.status ?? workflowSummary?.status)}
    />
  );
};
