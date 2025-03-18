import { useEffect, useState } from "react";

import { useGetTask } from "@squonk/data-manager-client/task";

export const usePolledGetTask = (taskId: string, pollInterval = 5000) => {
  const [refetchInterval, setRefetchInterval] = useState(pollInterval);
  const query = useGetTask(taskId, undefined, { query: { refetchInterval } });

  const done = query.data?.done;

  useEffect(() => {
    done && setRefetchInterval(Number.POSITIVE_INFINITY);
  }, [done]);

  return query;
};
