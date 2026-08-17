import { type ReactNode } from "react";

import { type RunningWorkflowSummary } from "@/api/data-manager";

import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { resolveResultWorkflowLifecycle } from "../../projects/workflowFacts";
import { CapabilityReasons } from "../results/CapabilityReasons";
import { ResultCard } from "../results/ResultCard";
import { WorkflowLifecycleButton } from "./WorkflowLifecycleButton";

export interface WorkflowResultCardProps {
  /** What the caller may do with this workflow, decided by it and the project that owns it. */
  capabilities: ResultCapabilities;
  /** Whatever the card is showing about this workflow's progress. */
  collapsed?: ReactNode;
  collapsedByDefault: boolean;
  /**
   * The project this workflow declares it belongs to. Every link built here is addressed inside
   * that project rather than the one the caller happens to be looking at.
   */
  projectId: string;
  /** Results list state this card's own link preserves. */
  resultsState?: ResultsState;
  /** The workflow as its project's own collection listed it, or as its own read answered. */
  workflow: Pick<
    RunningWorkflowSummary,
    "error_msg" | "error_num" | "id" | "name" | "started" | "status" | "stopped"
  >;
  /** Rows naming what the workflow is doing, shown beside its identity. */
  children?: ReactNode;
  /** Called once the Data Manager has accepted the workflow's deletion. */
  onDeleted?: () => void;
}

/**
 * The card one running workflow is presented on, wherever it is shown. Its identity, its own
 * canonical route, and its stop/delete action are decided here once, so a workflow listed with its
 * project and the same workflow on its own route can never drift apart in what they address or
 * offer.
 */
export const WorkflowResultCard = ({
  capabilities,
  collapsed,
  collapsedByDefault,
  projectId,
  resultsState,
  workflow,
  children,
  onDeleted,
}: WorkflowResultCardProps) => (
  <ResultCard
    accentColor="#f1c40f"
    actions={({ setSlideIn }) => (
      <>
        <WorkflowLifecycleButton
          capability={capabilities.workflowLifecycle}
          // The control names what it would do to the workflow this card is displaying. A card
          // showing content a refresh could not renew therefore still names the request that
          // content calls for, while the capability disables it for exactly that reason.
          lifecycle={resolveResultWorkflowLifecycle({ workflow })}
          projectId={projectId}
          runningWorkflowId={workflow.id}
          // Only a deletion the Data Manager accepted dismisses the workflow it deleted. A stop
          // and a rejection both leave the workflow exactly where it is.
          onDeleted={() => {
            setSlideIn(false);
            onDeleted?.();
          }}
        />
        <CapabilityReasons capabilities={[capabilities.workflowLifecycle]} />
      </>
    )}
    collapsed={collapsed}
    collapsedByDefault={collapsedByDefault}
    createdDateTime={workflow.started}
    finishedDateTime={workflow.stopped}
    href={projectLinks.result(projectId, "workflows", workflow.id, resultsState)}
    linkTitle={workflow.name}
    state={workflow.status}
  >
    {children}
  </ResultCard>
);
