import { useState } from "react";

import { useGetInstance } from "@squonk/data-manager-client/instance";

import { DONE_PHASES } from "../constants/instances";

export const usePolledGetInstance = (instanceId: string, pollInterval = 5000) => {
  const [refetchInterval, setRefetchInterval] = useState(pollInterval);
  return useGetInstance(instanceId, {
    query: {
      refetchInterval,
      onSuccess: (newInstance) => {
        DONE_PHASES.includes(newInstance.phase) && setRefetchInterval(Infinity);
      },
    },
  });
};
