import { type TaskGetResponse } from "@/api/data-manager";
import { useGetTask } from "@/api/data-manager/task";

import { resolveSectionReadState, sectionReadFailure, type SectionReadState } from "./sectionReads";
import {
  resolveResultTaskLifecycle,
  type ResultTaskLifecycle,
  resultTaskPollInterval,
} from "./taskFacts";

export type ResultTaskRead = {
  lifecycle: ResultTaskLifecycle;
  /** How the task's own read answered, by the same rule its collection is read by. */
  readState: SectionReadState;
  refetch: () => void;
  task: TaskGetResponse | undefined;
  /**
   * When the task last answered, however it answered. A caller acting on each answer needs this,
   * because a read that fails the same way twice reports the same lifecycle both times and would
   * otherwise be indistinguishable from a read that never happened.
   */
  updatedAt: number;
};

/**
 * The only owner of one addressed task's read and of the polling that follows it. The generated
 * query is the sole cache identity, so the task refreshed here is the same one the owning project's
 * Results refresh invalidates. How often it is asked again is decided by the task's own lifecycle
 * rather than by a timer that has to be told to stop: a task still running is polled, a read that
 * failed transiently backs off, and anything settled or unusable is not asked again at all.
 */
export const useResultTask = (taskId: string): ResultTaskRead => {
  const query = useGetTask(taskId, undefined, {
    query: {
      retry: false,
      refetchInterval: ({ state }) =>
        resultTaskPollInterval(
          resolveResultTaskLifecycle({
            task: state.data,
            taskError: sectionReadFailure({
              error: state.error,
              failureReason: state.fetchFailureReason,
            }),
          }),
        ),
    },
  });

  const error = sectionReadFailure(query);

  return {
    lifecycle: resolveResultTaskLifecycle({ task: query.data, taskError: error }),
    readState: resolveSectionReadState(error),
    refetch: () => void query.refetch(),
    task: query.data,
    updatedAt: Math.max(query.dataUpdatedAt, query.errorUpdatedAt),
  };
};
