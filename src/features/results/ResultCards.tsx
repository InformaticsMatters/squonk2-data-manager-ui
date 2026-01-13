import {
  type InstanceSummary,
  type RunningWorkflowSummary,
  type TaskSummary,
} from "@squonk/data-manager-client";

import { Grid, Typography } from "@mui/material";
import dayjs from "dayjs";

import { Instance } from "../../components/instances/Instance";
import { RunningWorkflowCard } from "../../components/RunningWorkflowCard/RunningWorkflowCard";
import { ResultTaskCard } from "../../components/tasks/ResultTaskCard";
import { search } from "../../utils/app/searches";

// Discriminated union type for result cards
export type ResultCardItem =
  | { type: "instance"; data: InstanceSummary }
  | { type: "task"; data: TaskSummary }
  | { type: "workflow"; data: RunningWorkflowSummary; time: string };

// Utility to map to discriminated union card objects
const mapToCardObjs = (
  instances: InstanceSummary[],
  tasks: TaskSummary[],
  workflows: RunningWorkflowSummary[],
): ResultCardItem[] => {
  const instanceCardObjs = instances.map((instance) => ({
    type: "instance" as const,
    data: instance,
  }));
  const taskCardObjs = tasks.map((task) => ({ type: "task" as const, data: task }));
  const workflowCardObjs = workflows.map((workflow) => ({
    type: "workflow" as const,
    data: workflow,
    time: workflow.started,
  }));
  return [...instanceCardObjs, ...taskCardObjs, ...workflowCardObjs];
};

// Utility to get the timestamp for sorting and rendering
const getTime = (card: ResultCardItem): string => {
  switch (card.type) {
    case "task":
      return card.data.created;
    case "instance":
      return card.data.launched;
    case "workflow":
      return card.time;
    default: {
      // Exhaustive check: if a new type is added, this will error
      const _exhaustive: never = card;
      return _exhaustive;
    }
  }
};

export interface ResultCardsProps {
  /**
   * Types of results to display. Others not present are filtered out.
   */
  resultTypes: string[];
  /**
   * Search argument by which to filter
   */
  searchValue: string;
  /**
   * Instances that might be displayed
   */
  instances: InstanceSummary[];
  /**
   * Tasks that might be displayed
   */
  tasks: TaskSummary[];
  /**
   * Workflows that might be displayed
   */
  workflows: RunningWorkflowSummary[];
}

/**
 * ResultCards displays filtered and sorted cards for instances, tasks, and workflows.
 * Workflows are scaffolded as placeholders until a real component is available.
 *
 */
export const ResultCards = ({
  resultTypes,
  searchValue,
  instances,
  tasks,
  workflows,
}: ResultCardsProps) => {
  // Tasks, instances, and workflows are filtered first by search value
  const instanceCards = (resultTypes.includes("instance") ? instances : []).filter(
    ({ job_name, name, phase }: InstanceSummary) => search([job_name, name, phase], searchValue),
  );

  const taskCards = (resultTypes.includes("task") ? tasks : [])
    .filter((task: TaskSummary) => task.purpose === "DATASET" || task.purpose === "FILE")
    .filter(({ processing_stage, purpose }: TaskSummary) =>
      search([processing_stage, purpose], searchValue),
    );

  const workflowCards = (resultTypes.includes("workflow") ? workflows : []).filter(
    ({ name, id }: RunningWorkflowSummary) => search([name, id], searchValue),
  );

  // Use utility to map to discriminated union
  const cards = mapToCardObjs(instanceCards, taskCards, workflowCards)
    .toSorted((a, b) => {
      const aTime = getTime(a);
      const bTime = getTime(b);
      return dayjs(bTime).isBefore(dayjs(aTime)) ? -1 : 1;
    })
    .map((item) => {
      switch (item.type) {
        case "workflow": {
          const workflow = item.data;
          return (
            <Grid key={workflow.id} size={{ xs: 12 }}>
              <RunningWorkflowCard runningWorkflowId={workflow.id} workflowSummary={workflow} />
            </Grid>
          );
        }
        case "task": {
          const task = item.data;
          return (
            <Grid key={task.id} size={{ xs: 12 }}>
              <ResultTaskCard task={task} />
            </Grid>
          );
        }
        case "instance": {
          const instance = item.data;
          return (
            <Grid key={instance.id} size={{ xs: 12 }}>
              <Instance
                instanceId={instance.id}
                instanceSummary={instance}
                projectClickAction="select-project"
              />
            </Grid>
          );
        }
        default: {
          // Exhaustive check
          const _exhaustive: never = item;
          return _exhaustive;
        }
      }
    });

  return cards.length > 0 ? (
    <Grid container spacing={2}>
      {cards}
    </Grid>
  ) : (
    <Typography align="center" variant="body2">
      There are no tasks, instances, or workflows to display.
    </Typography>
  );
};
