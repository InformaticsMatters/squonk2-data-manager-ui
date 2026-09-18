import { type RunningWorkflowGetResponse, type RunningWorkflowStep } from "@/api/data-manager";
import { useGetRunningWorkflow, useGetRunningWorkflowSteps } from "@/api/data-manager/workflow";

import { ownedBy, runningWorkflowOwner } from "./resultFacts";
import { resolveSectionReadState, sectionReadFailure, type SectionReadState } from "./sectionReads";
import {
  resolveResultWorkflowLifecycle,
  type ResultWorkflowLifecycle,
  resultWorkflowPollInterval,
} from "./workflowFacts";

export type ResultWorkflowRead = {
  lifecycle: ResultWorkflowLifecycle;
  /** How the workflow's own read answered, by the same rule its collection is read by. */
  readState: SectionReadState;
  refetch: () => void;
  /** The steps the addressed workflow has recorded so far. */
  steps: RunningWorkflowStep[] | undefined;
  /** How the steps read answered; a workflow that is readable can still lose its steps. */
  stepsReadState: SectionReadState;
  workflow: RunningWorkflowGetResponse | undefined;
};

/**
 * The only owner of one addressed running workflow's read, its steps, and the polling that follows
 * them. The generated queries are the sole cache identity, so the workflow refreshed here is the
 * same one the owning project's Results refresh invalidates.
 *
 * Everything past the workflow's own first answer stays inside the project it declares. A workflow
 * that declares another project is read once — reading it is the only way to learn it belongs
 * elsewhere — and then nothing further is asked about it: its steps are never requested and its
 * poll stops. Otherwise how often it is asked again is decided by the workflow's own lifecycle
 * rather than by a timer that has to be told to stop: a workflow still running is polled, a read
 * that failed transiently backs off, and anything settled or unusable is not asked again at all.
 * Its steps follow that same interval, because they only change while it is still running.
 */
export const useResultWorkflow = (
  runningWorkflowId: string,
  /** The project the workflow is addressed beneath; nothing is read past a workflow it disowns. */
  projectId: string,
): ResultWorkflowRead => {
  const addressedHere = (workflow?: Pick<RunningWorkflowGetResponse, "project">) =>
    workflow !== undefined && ownedBy(runningWorkflowOwner(workflow), projectId);

  const query = useGetRunningWorkflow(runningWorkflowId, {
    query: {
      retry: false,
      refetchInterval: ({ state }) =>
        state.data !== undefined && !addressedHere(state.data)
          ? false
          : resultWorkflowPollInterval(
              resolveResultWorkflowLifecycle({
                workflow: state.data,
                workflowError: sectionReadFailure({
                  error: state.error,
                  failureReason: state.fetchFailureReason,
                }),
              }),
            ),
    },
  });

  const error = sectionReadFailure(query);
  const lifecycle = resolveResultWorkflowLifecycle({ workflow: query.data, workflowError: error });
  const owned = addressedHere(query.data);

  const stepsQuery = useGetRunningWorkflowSteps(runningWorkflowId, {
    query: {
      enabled: owned,
      retry: false,
      refetchInterval: resultWorkflowPollInterval(lifecycle),
      select: (data) => data.running_workflow_steps,
    },
  });

  return {
    lifecycle,
    readState: resolveSectionReadState(error),
    refetch: () => {
      void query.refetch();
      if (owned) {
        void stepsQuery.refetch();
      }
    },
    steps: stepsQuery.data,
    stepsReadState: resolveSectionReadState(sectionReadFailure(stepsQuery)),
    workflow: query.data,
  };
};
