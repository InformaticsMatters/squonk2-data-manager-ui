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
  resolveResultsFreshness,
  resolveResultsReadState,
  type ResultItem,
  resultListRequests,
  type ResultsReadState,
  selectProjectResults,
} from "./resultFacts";

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
  freshness: "current" | "stale";
  isLoading: boolean;
  /** Every result the addressed project owns, before the section's route state narrows them. */
  items: ResultItem[];
  readState: ResultsReadState;
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
  // other two may show.
  const readStates = {
    instances: resolveResultReadState(instances.error),
    tasks: resolveResultReadState(tasks.error),
    workflows: resolveResultReadState(workflows.error),
  };
  const readState = resolveResultsReadState([instances.error, tasks.error, workflows.error]);
  const freshness = resolveResultsFreshness(readState);
  const items = selectProjectResults({
    instances: readable(readStates.instances, instances.data),
    projectId,
    tasks: readable(readStates.tasks, tasks.data),
    workflows: readable(readStates.workflows, workflows.data),
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
    readState,
    refresh,
    retry: () => {
      void instances.refetch();
      void tasks.refetch();
      void workflows.refetch();
    },
  };
};
