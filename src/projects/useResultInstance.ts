import { type InstanceGetResponse } from "@/api/data-manager";
import { useGetInstance } from "@/api/data-manager/instance";

import {
  resolveResultInstanceLifecycle,
  type ResultInstanceLifecycle,
  resultInstancePollInterval,
} from "./instanceFacts";
import { instanceOwner, ownedBy } from "./resultFacts";
import { resolveSectionReadState, sectionReadFailure, type SectionReadState } from "./sectionReads";

export type ResultInstanceRead = {
  instance: InstanceGetResponse | undefined;
  lifecycle: ResultInstanceLifecycle;
  /** How the instance's own read answered, by the same rule its collection is read by. */
  readState: SectionReadState;
  refetch: () => void;
};

/**
 * The only owner of one addressed instance's read and of the polling that follows it. The generated
 * query is the sole cache identity, so the instance refreshed here is the same one the owning
 * project's Results refresh invalidates, and a listed instance a caller expands is the same read as
 * the one on its own route.
 *
 * Nothing is asked past an instance that disowns the addressed project. Reading it once is the only
 * way to learn it belongs elsewhere; after that answer its poll stops rather than following a
 * result this project may not show. Otherwise how often it is asked again is decided by the
 * instance's own lifecycle rather than by a timer that has to be told to stop: an instance still in
 * the cluster is polled, a read that failed transiently backs off, and anything settled or unusable
 * is not asked again at all.
 */
export const useResultInstance = (
  instanceId: string,
  /** The project the instance is addressed beneath; one it disowns is not polled. */
  projectId: string,
): ResultInstanceRead => {
  const query = useGetInstance(instanceId, {
    query: {
      retry: false,
      refetchInterval: ({ state }) =>
        state.data !== undefined && !ownedBy(instanceOwner(state.data), projectId)
          ? false
          : resultInstancePollInterval(
              resolveResultInstanceLifecycle({
                instance: state.data,
                instanceError: sectionReadFailure({
                  error: state.error,
                  failureReason: state.fetchFailureReason,
                }),
              }),
            ),
    },
  });

  const error = sectionReadFailure(query);

  return {
    instance: query.data,
    lifecycle: resolveResultInstanceLifecycle({ instance: query.data, instanceError: error }),
    readState: resolveSectionReadState(error),
    refetch: () => void query.refetch(),
  };
};
