import { useEffect, useState } from "react";

import { useGetInstance } from "@squonk/data-manager-client/instance";

import { DONE_PHASES } from "../constants/instances";

export const usePolledGetInstance = (instanceId: string, pollInterval = 5000) => {
  const [refetchInterval, setRefetchInterval] = useState(pollInterval);
  const query = useGetInstance(instanceId, { query: { refetchInterval } });

  const done = query.data?.phase && DONE_PHASES.includes(query.data.phase);

  useEffect(() => {
    done && setRefetchInterval(Number.POSITIVE_INFINITY);
  }, [done]);

  return query;
};
