import { useState } from "react";

import { useGetTask } from "@squonk/data-manager-client/task";

export const usePolledGetTask = (taskId: string, pollInterval = 5000) => {
  const [refetchInterval, setRefetchInterval] = useState(pollInterval);
  return useGetTask(taskId, undefined, {
    query: {
      refetchInterval,
      onSuccess: (newTask) => {
        newTask.done && setRefetchInterval(Infinity);
      },
    },
  });
};
