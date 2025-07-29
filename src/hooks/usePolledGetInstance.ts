import { useEffect, useState } from "react";

import { useGetInstance } from "@squonk/data-manager-client/instance";

import { INSTANCE_DONE_PHASES } from "../constants/results";

export const usePolledGetInstance = (instanceId: string, pollInterval = 5000) => {
  const [refetchInterval, setRefetchInterval] = useState<number | false | undefined>(pollInterval);
  const query = useGetInstance(instanceId, { query: { refetchInterval } });

  const done = query.data?.phase && INSTANCE_DONE_PHASES.includes(query.data.phase);

  useEffect(() => {
    done && setRefetchInterval(false);
  }, [done]);

  return query;
};
