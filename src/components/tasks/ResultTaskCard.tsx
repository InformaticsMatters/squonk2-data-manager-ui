import { type TaskSummary } from "@/api/data-manager";

import { CardContent } from "@mui/material";

import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { type ResultsState } from "../../projects/routes";
import { TaskDetails } from "./TaskDetails";
import { TaskResultCard } from "./TaskResultCard";

export interface ResultTaskCardProps {
  /**
   * The task which will be displayed
   */
  task: TaskSummary;
  /**
   * The project this task was read under. A task resource declares no project of its own, so its
   * project-constrained list request is its only ownership fact.
   */
  projectId: string;
  /**
   * What the caller may do with this task in that project.
   */
  capabilities: ResultCapabilities;
  /**
   * Results list state this card's links preserve.
   */
  resultsState?: ResultsState;
  /**
   * Whether the card should have its collapsed content visible immediately. Defaults to true.
   */
  collapsedByDefault?: boolean;
}

/**
 * One listed task. Its progress is only read once the caller expands it, so listing a project's
 * results asks the Data Manager for the collection alone and never for every task in it.
 */
export const ResultTaskCard = ({
  task,
  projectId,
  capabilities,
  resultsState,
  collapsedByDefault = true,
}: ResultTaskCardProps) => (
  <TaskResultCard
    capabilities={capabilities}
    collapsed={
      <CardContent>
        <TaskDetails taskId={task.id} />
      </CardContent>
    }
    collapsedByDefault={collapsedByDefault}
    projectId={projectId}
    resultsState={resultsState}
    task={task}
  />
);
