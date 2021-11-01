import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetInstance } from '@squonk/data-manager-client/instance';

export const usePolledInstance = (instanceId: InstanceSummary['id'], poll = false) => {
  return useGetInstance(instanceId, undefined, {
    query: { refetchInterval: poll ? 5000 : undefined },
  });
};
