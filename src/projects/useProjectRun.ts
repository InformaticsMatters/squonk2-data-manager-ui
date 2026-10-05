import { useMemo } from "react";

import {
  getGetApplicationsQueryKey,
  getGetApplicationsSuspenseQueryOptions,
} from "@/api/data-manager/application";
import {
  getGetInstancesQueryKey,
  getGetInstancesSuspenseQueryOptions,
} from "@/api/data-manager/instance";
import { getGetJobsQueryKey, getGetJobsSuspenseQueryOptions } from "@/api/data-manager/job";
import {
  getGetRunningWorkflowsQueryKey,
  getGetRunningWorkflowsSuspenseQueryOptions,
  getGetWorkflowsQueryKey,
  getGetWorkflowsSuspenseQueryOptions,
} from "@/api/data-manager/workflow";

import { useQueryClient } from "@tanstack/react-query";

import { useSettledQueries, useSettledQuery } from "../hooks/useSettledQuery";
import { developmentJobs, seedDevelopmentDefinitions } from "./developmentDefinitions";
import { type RunFilterType } from "./routes";
import {
  resolveRunFreshnessByType,
  runCatalogueRequests,
  type RunDefinitionItem,
  type RunExecutions,
  runInstanceExecutions,
  type RunReadStates,
  runRunningWorkflowExecutions,
  selectRunCatalogue,
} from "./runFacts";
import {
  readableContent,
  resolveSectionReadReport,
  resolveSectionReadState,
  sectionReadFailure,
  type SectionReadReport,
} from "./sectionReads";

export type ProjectRunCatalogue = {
  /**
   * The addressed project's own executions, per collection: still being read, unreadable, or read
   * and therefore countable. They are read separately from the definitions they came from, so a
   * card must not answer that it has none until its own collection arrives — and a card waits only
   * on the collection its own badge counts. They are the same executions the composition already
   * holds, so a card's count costs no read of its own.
   */
  executions: { instances: RunExecutions; runningWorkflows: RunExecutions };
  /** Each catalogue's content is only as fresh as its own last read. */
  freshness: Record<RunFilterType, "current" | "stale">;
  /** Every definition the catalogue offers, before the section's route state narrows them. */
  items: RunDefinitionItem[];
  /** How each definition catalogue's own read answered, so one never speaks for another. */
  readStates: RunReadStates;
  /** What the section must tell the caller about every read it made. */
  report: SectionReadReport;
  /** Refreshes the displayed catalogue without changing what is displayed. */
  refresh: () => void;
  /** Retries the reads that failed, leaving the addressed project and route untouched. */
  retry: () => void;
};

/**
 * Composes the Run catalogue from the generated application, job, and workflow definitions and the
 * addressed project's own instances and running workflows. Every read the Data Manager scopes by
 * project names the project in the URL, and their generated query options remain the only cache
 * identity for them, so the section keeps no aggregate of its own.
 */
export const useProjectRun = (projectId: string): ProjectRunCatalogue => {
  const queryClient = useQueryClient();
  const requests = useMemo(() => runCatalogueRequests(projectId), [projectId]);

  // Seeded before anything suspends, so a development definition's own route finds it answered.
  seedDevelopmentDefinitions(queryClient);

  const reads = {
    applications: getGetApplicationsSuspenseQueryOptions({
      query: { retry: false, select: (data) => data.applications },
    }),
    instances: getGetInstancesSuspenseQueryOptions(requests.instances, {
      query: { retry: false, select: (data) => data.instances },
    }),
    jobs: getGetJobsSuspenseQueryOptions(requests.jobs, {
      query: { retry: false, select: (data) => data.jobs },
    }),
    runningWorkflows: getGetRunningWorkflowsSuspenseQueryOptions(requests.runningWorkflows, {
      query: { retry: false, select: (data) => data.running_workflows },
    }),
    workflows: getGetWorkflowsSuspenseQueryOptions({
      query: { retry: false, select: (data) => data.workflows },
    }),
  };
  // Every read is started together and answered before the catalogue is shown, so the cards arrive
  // at once, each with its count, rather than filling in read by read. A failed read is an answer
  // like any other: it is classified below, and never takes down the reads beside it.
  useSettledQueries(Object.values(reads));
  const applications = useSettledQuery(reads.applications);
  const jobs = useSettledQuery(reads.jobs);
  const workflows = useSettledQuery(reads.workflows);
  const instances = useSettledQuery(reads.instances);
  const runningWorkflows = useSettledQuery(reads.runningWorkflows);

  // Each read answers for itself, so one refused or failing read never decides what the others may
  // show, how fresh they are, or whether they are worth retrying.
  const readStates: RunReadStates = {
    application: resolveSectionReadState(sectionReadFailure(applications)),
    job: resolveSectionReadState(sectionReadFailure(jobs)),
    workflow: resolveSectionReadState(sectionReadFailure(workflows)),
  };
  // The addressed project's own executions are read separately from the definitions they came
  // from, so a failure to list them is reported and retried rather than passing unnoticed, and a
  // confirmed refusal removes them instead of leaving them beside a definition.
  const executionReadStates = {
    instance: resolveSectionReadState(sectionReadFailure(instances)),
    runningWorkflow: resolveSectionReadState(sectionReadFailure(runningWorkflows)),
  };
  const report = resolveSectionReadReport([
    ...Object.values(readStates),
    ...Object.values(executionReadStates),
  ]);
  const freshness = resolveRunFreshnessByType(readStates);

  const items = selectRunCatalogue({
    applications: readableContent(readStates.application, applications.data),
    jobs: [...readableContent(readStates.job, jobs.data), ...developmentJobs],
    workflows: readableContent(readStates.workflow, workflows.data),
  });

  const ownedInstances = readableContent(executionReadStates.instance, instances.data);
  const ownedRunningWorkflows = readableContent(
    executionReadStates.runningWorkflow,
    runningWorkflows.data,
  );

  return {
    // The counts the cards state are a pure fact of the executions already read here, so the
    // section issues no read on their account.
    executions: {
      instances: runInstanceExecutions(
        { isLoading: instances.isLoading, readState: executionReadStates.instance },
        ownedInstances,
        projectId,
      ),
      runningWorkflows: runRunningWorkflowExecutions(
        { isLoading: runningWorkflows.isLoading, readState: executionReadStates.runningWorkflow },
        ownedRunningWorkflows,
        projectId,
      ),
    },
    freshness,
    items,
    readStates,
    report,
    refresh: () => {
      for (const queryKey of [
        getGetApplicationsQueryKey(),
        getGetJobsQueryKey(requests.jobs),
        getGetWorkflowsQueryKey(),
        getGetInstancesQueryKey(requests.instances),
        getGetRunningWorkflowsQueryKey(requests.runningWorkflows),
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
    retry: () => {
      void applications.refetch();
      void jobs.refetch();
      void workflows.refetch();
      void instances.refetch();
      void runningWorkflows.refetch();
    },
  };
};
