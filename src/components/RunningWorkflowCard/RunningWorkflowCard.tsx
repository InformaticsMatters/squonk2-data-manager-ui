import { type RunningWorkflowGetResponse, type RunningWorkflowSummary } from "@/api/data-manager";
import { useGetRunningWorkflow } from "@/api/data-manager/workflow";

import { Alert } from "@mui/material";

import { capabilityIsEnabled } from "../../projects/capabilities";
import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { CenterLoader } from "../CenterLoader";
import { DeleteWorkflowButton } from "../DeleteWorkflowButton";
import { CapabilityReasons } from "../results/CapabilityReasons";
import { ResultCard } from "../results/ResultCard";
import { RunningWorkflowCollapsed } from "./RunningWorkflowCollapsed";

export interface RunningWorkflowCardProps {
  runningWorkflowId: string;
  /**
   * The running workflow a caller has already resolved, kept on screen even if a later read fails.
   */
  workflowSummary?: RunningWorkflowGetResponse | RunningWorkflowSummary;
  /**
   * The project the running workflow itself declares it belongs to.
   */
  projectId: string;
  /**
   * What the caller may do with this running workflow in that project.
   */
  capabilities: ResultCapabilities;
  /**
   * Results list state this card's links preserve.
   */
  resultsState?: ResultsState;
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
  projectId,
  capabilities,
  resultsState,
  collapsedByDefault = true,
}: RunningWorkflowCardProps) => {
  const { data: workflow, isLoading, error } = useGetRunningWorkflow(runningWorkflowId);

  if (isLoading && !workflowSummary) {
    return <CenterLoader />;
  }
  // The summary the collection already returned still describes this workflow, so a failed detail
  // read leaves the card readable rather than replacing it with an error.
  if (error && !workflowSummary) {
    return <Alert severity="error">Failed to load workflow</Alert>;
  }

  return (
    <ResultCard
      accentColor="#f1c40f"
      actions={() => (
        <>
          <DeleteWorkflowButton
            disabled={!capabilityIsEnabled(capabilities.workflowLifecycle)}
            projectId={projectId}
            runningWorkflowId={runningWorkflowId}
            status={workflow?.status ?? workflowSummary?.status}
          />
          <CapabilityReasons capabilities={[capabilities.workflowLifecycle]} />
        </>
      )}
      collapsed={
        <RunningWorkflowCollapsed projectId={projectId} runningWorkflowId={runningWorkflowId} />
      }
      collapsedByDefault={collapsedByDefault}
      createdDateTime={workflow?.started ?? workflowSummary?.started ?? ""}
      finishedDateTime={workflow?.stopped ?? workflowSummary?.stopped ?? ""}
      href={projectLinks.result(projectId, "workflows", runningWorkflowId, resultsState)}
      linkTitle={workflow?.name ?? workflowSummary?.name ?? "Workflow"}
      state={mapWorkflowStatusToState(workflow?.status ?? workflowSummary?.status)}
    />
  );
};
