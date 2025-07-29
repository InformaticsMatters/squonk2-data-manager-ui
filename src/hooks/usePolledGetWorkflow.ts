import { useEffect, useState } from "react";

import {
  useGetRunningWorkflow,
  useGetRunningWorkflowSteps,
} from "@squonk/data-manager-client/workflow";

import { WORKFLOW_DONE_PHASES } from "../constants/results";

export const usePolledGetWorkflow = (workflowId: string, pollInterval = 5000) => {
  const [refetchInterval, setRefetchInterval] = useState<number | false | undefined>(pollInterval);
  const query = useGetRunningWorkflow(workflowId, { query: { refetchInterval } });
  const { data: done } = useGetRunningWorkflow(workflowId, {
    query: { refetchInterval, select: (data) => WORKFLOW_DONE_PHASES.includes(data.status) },
  });

  useEffect(() => {
    done && setRefetchInterval(false);
  }, [done]);

  return query;
};

export const usePolledGetWorkflowSteps = (workflowId: string, pollInterval = 5000) => {
  const [refetchInterval, setRefetchInterval] = useState<number | false | undefined>(pollInterval);
  const query = useGetRunningWorkflowSteps(workflowId, {
    query: { select: (data) => data.running_workflow_steps, refetchInterval },
  });

  const { data: done } = useGetRunningWorkflow(workflowId, {
    query: { refetchInterval, select: (data) => WORKFLOW_DONE_PHASES.includes(data.status) },
  });

  useEffect(() => {
    done && setRefetchInterval(false);
  }, [done]);

  return query;
};
