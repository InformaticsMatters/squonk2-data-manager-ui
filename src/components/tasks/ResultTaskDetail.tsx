import { type TaskGetResponse, type TaskSummary } from "@/api/data-manager";

import { Link, ListItem, ListItemText } from "@mui/material";
import NextLink from "next/link";

import { datasetLinks } from "../../datasets/routes";
import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { type ResultTaskLifecycle, resultTaskOutput } from "../../projects/taskFacts";
import { TaskProgress } from "./TaskProgress";
import { TaskResultCard } from "./TaskResultCard";

export interface ResultTaskDetailProps {
  /** What the caller may do with this task, decided by the task and the project that owns it. */
  capabilities: ResultCapabilities;
  lifecycle: ResultTaskLifecycle;
  /**
   * The project that owns this task, as its project-constrained collection accounted for it. Every
   * link this card builds is addressed inside that project.
   */
  projectId: string;
  /** Results list state this card's links preserve. */
  resultsState?: ResultsState;
  /** The task as its project's own collection listed it. */
  summary: TaskSummary;
  /** The addressed task's own read. */
  task: TaskGetResponse;
  /** Called once the Data Manager has accepted the task's deletion. */
  onDeleted?: () => void;
}

const lifecycleSummary = (lifecycle: ResultTaskLifecycle, task: TaskGetResponse) => {
  switch (lifecycle.kind) {
    // A task can fail with a zero exit code, so only a code that accounts for the failure is
    // reported beside it; the failure's own words are stated with the task's progress.
    case "failed":
      return task.exit_code ? `Failed (exit code ${task.exit_code})` : "Failed";
    case "pending":
      return "Running";
    case "succeeded":
      return "Succeeded";
    case "unconfirmed":
    case "unestablished":
    case "unknown":
      return "Not established";
  }
};

/**
 * What one task produced, addressed by the identity the task itself gave. A dataset version is
 * addressed in Datasets; a file task's product is a file of the project that ran it, so it is
 * addressed inside that project rather than through whichever project was entered before.
 */
const TaskOutputs = ({ projectId, task }: { projectId: string; task: TaskGetResponse }) => {
  const output = resultTaskOutput(task);

  return (
    <>
      {output.dataset === undefined ? null : (
        <ListItem>
          <ListItemText
            primary={output.projectFile ? "Attached dataset" : "Dataset"}
            secondary={
              <Link
                component={NextLink}
                href={
                  (output.dataset.version === undefined
                    ? datasetLinks.dataset(output.dataset.datasetId)
                    : datasetLinks.version(
                        output.dataset.datasetId,
                        output.dataset.version,
                      )) as never
                }
              >
                {output.dataset.version === undefined
                  ? "Dataset"
                  : `Version ${output.dataset.version}`}
              </Link>
            }
          />
        </ListItem>
      )}
      {output.projectFile ? (
        <ListItem>
          <ListItemText
            primary="Output"
            secondary={
              <Link component={NextLink} href={projectLinks.files(projectId) as never}>
                Project files
              </Link>
            }
          />
        </ListItem>
      ) : null}
    </>
  );
};

/**
 * One addressed task, presented under the project that owns it. Its purpose, what it produced, its
 * progress, and its delete action are all taken from the concrete task and that project, so nothing
 * on this card is derived from a selected or previously current project.
 */
export const ResultTaskDetail = ({
  capabilities,
  lifecycle,
  projectId,
  resultsState,
  summary,
  task,
  onDeleted,
}: ResultTaskDetailProps) => (
  <TaskResultCard
    capabilities={capabilities}
    collapsed={<TaskProgress lifecycle={lifecycle} task={task} />}
    collapsedByDefault={false}
    projectId={projectId}
    resultsState={resultsState}
    task={{ ...summary, created: task.created, purpose: task.purpose }}
    onDeleted={onDeleted}
  >
    <ListItem>
      <ListItemText primary="Status" secondary={lifecycleSummary(lifecycle, task)} />
    </ListItem>
    <TaskOutputs projectId={projectId} task={task} />
  </TaskResultCard>
);
