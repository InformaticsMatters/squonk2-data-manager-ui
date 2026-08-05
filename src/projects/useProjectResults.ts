import { useMemo } from "react";

import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  useGetInstances,
} from "@/api/data-manager/instance";
import { getGetTaskQueryKey, getGetTasksQueryKey, useGetTasks } from "@/api/data-manager/task";
import {
  getGetRunningWorkflowQueryKey,
  getGetRunningWorkflowsQueryKey,
  useGetRunningWorkflows,
} from "@/api/data-manager/workflow";

import { useQueryClient } from "@tanstack/react-query";

import {
  resolveResultReadState,
  resolveResultsFreshnessByCollection,
  resolveResultsReadReport,
  type ResultItem,
  resultListRequests,
  type ResultsReadReport,
  type ResultsReadState,
  type ResultsReadStates,
  selectProjectResults,
} from "./resultFacts";
import { type ResultFilterType } from "./routes";

/** The generated detail cache identity of one displayed result, refreshed alongside its list. */
const resultKey = (item: ResultItem) => {
  switch (item.kind) {
    case "instance":
      return getGetInstanceQueryKey(item.id);
    case "task":
      return getGetTaskQueryKey(item.id);
    case "workflow":
      return getGetRunningWorkflowQueryKey(item.id);
  }
};

/** Content the caller is known to have lost access to is not shown, however recently it loaded. */
const readable = <TResult>(state: ResultsReadState, data: TResult[] | undefined): TResult[] =>
  state.kind === "unavailable" ? [] : (data ?? []);

export type ProjectResults = {
  /** Each collection's content is only as fresh as its own last read. */
  freshness: Record<ResultFilterType, "current" | "stale">;
  isLoading: boolean;
  /** Every result the addressed project owns, before the section's route state narrows them. */
  items: ResultItem[];
  /** How each collection's own read answered, so one never speaks for another. */
  readStates: ResultsReadStates;
  /** What the section must tell the caller about those reads. */
  report: ResultsReadReport;
  /** Refreshes the displayed results without changing what is displayed. */
  refresh: () => void;
  /** Retries the reads that failed, leaving the addressed project and route untouched. */
  retry: () => void;
};

/**
 * Composes the Results section from the generated instance, task, and running-workflow collections.
 * Each read is constrained to the project in the URL, and their generated query options remain the
 * only cache identity for them, so the section keeps no aggregate of its own.
 */
export const useProjectResults = (projectId: string): ProjectResults => {
  const queryClient = useQueryClient();
  const requests = useMemo(() => resultListRequests(projectId), [projectId]);

  const instances = useGetInstances(requests.instances, {
    query: { retry: false, select: (data) => data.instances },
  });
  const tasks = useGetTasks(requests.tasks, {
    query: { retry: false, select: (data) => data.tasks },
  });
  const workflows = useGetRunningWorkflows(requests.workflows, {
    query: { retry: false, select: (data) => data.running_workflows },
  });

  // Each collection answers for itself, so one refused or failing read never decides what the
  // other two may show, how fresh they are, or whether they are worth retrying.
  const readStates: ResultsReadStates = {
    instance: resolveResultReadState(instances.error),
    task: resolveResultReadState(tasks.error),
    workflow: resolveResultReadState(workflows.error),
  };
  const report = resolveResultsReadReport(readStates);
  const freshness = resolveResultsFreshnessByCollection(readStates);
  const items = selectProjectResults({
    instances: readable(readStates.instance, instances.data),
    projectId,
    tasks: readable(readStates.task, tasks.data),
    workflows: readable(readStates.workflow, workflows.data),
  });

  const refresh = () => {
    const listKeys = [
      getGetInstancesQueryKey(requests.instances),
      getGetTasksQueryKey(requests.tasks),
      getGetRunningWorkflowsQueryKey(requests.workflows),
    ];
    const resultKeys = items.map((item) => resultKey(item));
    for (const queryKey of [...listKeys, ...resultKeys]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  };

  return {
    freshness,
    isLoading: instances.isLoading || tasks.isLoading || workflows.isLoading,
    items,
    readStates,
    report,
    refresh,
    retry: () => {
      void instances.refetch();
      void tasks.refetch();
      void workflows.refetch();
    },
  };
};
