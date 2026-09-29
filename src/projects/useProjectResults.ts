import { useMemo } from "react";

import { getGetApplicationsQueryKey, useGetApplications } from "@/api/data-manager/application";
import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  useGetInstances,
} from "@/api/data-manager/instance";
import { getGetJobsQueryKey, useGetJobs } from "@/api/data-manager/job";
import { getGetTaskQueryKey, getGetTasksQueryKey, useGetTasks } from "@/api/data-manager/task";
import {
  getGetRunningWorkflowQueryKey,
  getGetRunningWorkflowsQueryKey,
  getGetWorkflowsQueryKey,
  useGetRunningWorkflows,
  useGetWorkflows,
} from "@/api/data-manager/workflow";

import { useQueryClient } from "@tanstack/react-query";

import { developmentJobs } from "./developmentDefinitions";
import {
  resolveResultsDefinition,
  resolveResultsFreshnessByCollection,
  resolveResultsReadReport,
  type ResultItem,
  resultListRequests,
  type ResultsDefinitionResolution,
  type ResultsReadStates,
  selectProjectResults,
} from "./resultFacts";
import { type ResultFilterType, type UncheckedDefinitionFilter } from "./routes";
import {
  readableContent,
  resolveSectionReadState,
  sectionReadFailure,
  type SectionReadReport,
  type SectionReadState,
} from "./sectionReads";

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

/**
 * The catalogue that publishes one definition type, read only while a filter names that type. The
 * unfiltered page issues none of these, and a filtered one issues exactly the one it needs.
 *
 * Jobs are read with the same project-constrained arguments the Run catalogue uses, so the two
 * sections share one cache identity for them rather than each keeping a copy of the same list.
 */
const useDefinitionCatalogue = (
  projectId: string,
  definition: UncheckedDefinitionFilter | undefined,
) => {
  const jobRequest = useMemo(() => ({ project_id: projectId }), [projectId]);
  const applications = useGetApplications({
    query: {
      enabled: definition?.definitionType === "applications",
      retry: false,
      select: (data) => data.applications,
    },
  });
  const jobs = useGetJobs(jobRequest, {
    query: {
      enabled: definition?.definitionType === "jobs",
      retry: false,
      select: (data) => data.jobs,
    },
  });
  const workflows = useGetWorkflows({
    query: {
      enabled: definition?.definitionType === "workflows",
      retry: false,
      select: (data) => data.workflows,
    },
  });

  // The one catalogue the filter names, and nothing at all without a filter — so every answer
  // below is that catalogue's own, and a page carrying no filter has no catalogue read to answer
  // for, report, refresh or retry.
  const read = definition && { applications, jobs, workflows }[definition.definitionType];
  const readState: SectionReadState = resolveSectionReadState(
    read === undefined ? null : sectionReadFailure(read),
  );

  return {
    /** What that read published, which is the only place a definition's identity can come from. */
    content: {
      applications: readableContent(readState, applications.data),
      // Definitions that exist only while developing are offered by the Run catalogue in the same
      // way, so a filter naming one resolves here rather than reading as a definition that is gone.
      jobs: [...readableContent(readState, jobs.data), ...developmentJobs],
      workflows: readableContent(readState, workflows.data),
    },
    isLoading: read?.isLoading ?? false,
    /** The generated cache identity of that one read, which a refresh invalidates. */
    key:
      definition &&
      {
        applications: getGetApplicationsQueryKey(),
        jobs: getGetJobsQueryKey(jobRequest),
        workflows: getGetWorkflowsQueryKey(),
      }[definition.definitionType],
    readState,
    refetch: () => {
      void read?.refetch();
    },
  };
};

export type ProjectResults = {
  /** What the section knows about the definition the URL narrows to, if it narrows to one. */
  definition: ResultsDefinitionResolution;
  /** Each collection's content is only as fresh as its own last read. */
  freshness: Record<ResultFilterType, "current" | "stale">;
  isLoading: boolean;
  /** Every result the addressed project owns, before the section's route state narrows them. */
  items: ResultItem[];
  /** How each collection's own read answered, so one never speaks for another. */
  readStates: ResultsReadStates;
  /** What the section must tell the caller about those reads. */
  report: SectionReadReport;
  /** Refreshes the displayed results without changing what is displayed. */
  refresh: () => void;
  /** Retries the reads that failed, leaving the addressed project and route untouched. */
  retry: () => void;
};

/**
 * Composes the Results section from the generated instance, task, and running-workflow collections.
 * Each read is constrained to the project in the URL, and their generated query options remain the
 * only cache identity for them, so the section keeps no aggregate of its own.
 *
 * A definition filter adds one catalogue read and changes nothing else. The list requests stay a
 * pure function of the project: the Data Manager's running-workflow collection does accept a
 * workflow argument and it is deliberately not used, because a request argument that varied with
 * view state would split one project's Results into several cache identities with independent
 * freshness, retry and refresh behaviour.
 */
export const useProjectResults = (
  projectId: string,
  /** The definition the URL narrows to, which is read for and matched against, never fetched by. */
  definition?: UncheckedDefinitionFilter,
): ProjectResults => {
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
    instance: resolveSectionReadState(sectionReadFailure(instances)),
    task: resolveSectionReadState(sectionReadFailure(tasks)),
    workflow: resolveSectionReadState(sectionReadFailure(workflows)),
  };
  // The definition catalogue joins them on the same terms: it answers for itself, and its failure
  // does not decide what the collections beside it may show.
  const definitionCatalogue = useDefinitionCatalogue(projectId, definition);
  // A catalogue read that was never issued reports nothing, so the unfiltered page pays nothing.
  const report = resolveResultsReadReport(readStates, definition && definitionCatalogue.readState);
  const freshness = resolveResultsFreshnessByCollection(readStates);
  const items = selectProjectResults({
    instances: readableContent(readStates.instance, instances.data),
    projectId,
    tasks: readableContent(readStates.task, tasks.data),
    workflows: readableContent(readStates.workflow, workflows.data),
  });

  const refresh = () => {
    const listKeys = [
      getGetInstancesQueryKey(requests.instances),
      getGetTasksQueryKey(requests.tasks),
      getGetRunningWorkflowsQueryKey(requests.workflows),
      // The unfiltered page has no catalogue read to refresh; the filtered one refreshes the
      // definition it resolved against, beside the results it narrowed.
      ...(definitionCatalogue.key ? [definitionCatalogue.key] : []),
    ];
    const resultKeys = items.map((item) => resultKey(item));
    for (const queryKey of [...listKeys, ...resultKeys]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  };

  return {
    definition: resolveResultsDefinition({
      catalogue: definitionCatalogue.content,
      definition,
      isLoading: definitionCatalogue.isLoading,
      readState: definitionCatalogue.readState,
    }),
    freshness,
    // The collections alone. An addressed result has no use for a definition catalogue, so the
    // filter leaves the result detail route exactly as it was; the list waits for the definition
    // through its own pending resolution instead.
    isLoading: instances.isLoading || tasks.isLoading || workflows.isLoading,
    items,
    readStates,
    report,
    refresh,
    retry: () => {
      void instances.refetch();
      void tasks.refetch();
      void workflows.refetch();
      definitionCatalogue.refetch();
    },
  };
};
