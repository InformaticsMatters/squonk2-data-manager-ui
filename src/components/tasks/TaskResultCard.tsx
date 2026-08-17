import { type ReactNode } from "react";

import { type TaskSummary } from "@/api/data-manager";

import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { CapabilityReasons } from "../results/CapabilityReasons";
import { ResultCard } from "../results/ResultCard";
import { DeleteTaskButton } from "./DeleteTaskButton";

export interface TaskResultCardProps {
  /** What the caller may do with this task, decided by the concrete task and its project. */
  capabilities: ResultCapabilities;
  /** Whatever the card is showing about this task's progress. */
  collapsed: ReactNode;
  collapsedByDefault: boolean;
  /**
   * The project this task was read under. A task resource declares no project of its own, so its
   * project-constrained list request is its only ownership fact, and every link built here is
   * addressed inside that project.
   */
  projectId: string;
  /** Results list state this card's own link preserves. */
  resultsState?: ResultsState;
  /** The task as the project's own collection listed it. */
  task: Pick<TaskSummary, "created" | "id" | "processing_stage" | "purpose">;
  /** Rows naming what the task produced, shown beside its identity. */
  children?: ReactNode;
  /** Called once the Data Manager has accepted the task's deletion. */
  onDeleted?: () => void;
}

/**
 * The card one task is presented on, wherever it is shown. Its identity, its own canonical route,
 * and its delete action are decided here once, so a task listed with its project and the same task
 * on its own route can never drift apart in what they address or offer.
 */
export const TaskResultCard = ({
  capabilities,
  collapsed,
  collapsedByDefault,
  projectId,
  resultsState,
  task,
  children,
  onDeleted,
}: TaskResultCardProps) => (
  <ResultCard
    actions={({ setSlideIn }) => (
      <>
        <DeleteTaskButton
          capability={capabilities.taskDeletion}
          projectId={projectId}
          taskId={task.id}
          // Only a deletion the Data Manager accepted dismisses the task it deleted. A rejected one
          // changes nothing, so the task stays exactly where the rejection was reported.
          onDeleted={() => {
            setSlideIn(false);
            onDeleted?.();
          }}
        />
        <CapabilityReasons capabilities={[capabilities.taskDeletion]} />
      </>
    )}
    collapsed={collapsed}
    collapsedByDefault={collapsedByDefault}
    createdDateTime={task.created}
    href={projectLinks.result(projectId, "tasks", task.id, resultsState)}
    linkTitle={task.purpose}
    showDuration={false}
    state={task.processing_stage}
  >
    {children}
  </ResultCard>
);
