import { useEffect, useMemo } from "react";

import { type InstanceSummary, type RunningWorkflowSummary } from "@/api/data-manager";
import { getGetApplicationsQueryKey, useGetApplications } from "@/api/data-manager/application";
import { getGetInstancesQueryKey, useGetInstances } from "@/api/data-manager/instance";
import { getGetJobsQueryKey, useGetJobs } from "@/api/data-manager/job";
import {
  getGetRunningWorkflowsQueryKey,
  getGetWorkflowsQueryKey,
  useGetRunningWorkflows,
  useGetWorkflows,
} from "@/api/data-manager/workflow";

import { useQueryClient } from "@tanstack/react-query";

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
   * on the collection it actually lists and counts. They are the same executions the composition
   * already holds, so a card's count costs no read of its own.
   */
  executions: { instances: RunExecutions; runningWorkflows: RunExecutions };
  /** Each catalogue's content is only as fresh as its own last read. */
  freshness: Record<RunFilterType, "current" | "stale">;
  /** Existing instances of the addressed project, offered beside the definitions that made them. */
  instances: InstanceSummary[];
  /** The definition catalogues are still being read, so nothing can be said about what they offer. */
  isLoading: boolean;
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
  /** Running workflows of the addressed project, offered beside their definitions. */
  runningWorkflows: RunningWorkflowSummary[];
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

  const applications = useGetApplications({
    query: { retry: false, select: (data) => data.applications },
  });
  const jobs = useGetJobs(requests.jobs, { query: { retry: false, select: (data) => data.jobs } });
  const workflows = useGetWorkflows({ query: { retry: false, select: (data) => data.workflows } });
  const instances = useGetInstances(requests.instances, {
    query: { retry: false, select: (data) => data.instances },
  });
  const runningWorkflows = useGetRunningWorkflows(requests.runningWorkflows, {
    query: { retry: false, select: (data) => data.running_workflows },
  });

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

  useEffect(() => {
    seedDevelopmentDefinitions(queryClient);
  }, [queryClient]);
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
    instances: ownedInstances,
    isLoading: applications.isLoading || jobs.isLoading || workflows.isLoading,
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
    runningWorkflows: ownedRunningWorkflows,
  };
};
