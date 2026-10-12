import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";
import { useGetJob } from "@/api/data-manager/job";

import { readRunDefinitionVariables, suppliedRunInputs } from "../../../../projects/runLaunchForm";
import { TEST_JOB_ID } from "../../../runCards/TestJob/jobId";

// Contains only fields we are interested in
type ApplicationSpecification = { variables?: Record<string, unknown> };

/**
 * Returns provided inputs with their information. It matches the provided inputs with their
 * property definition which are provided by the GET /jobs/job_id endpoint
 */
export const useGetJobInputs = (instance: InstanceGetResponse | InstanceSummary) => {
  const inputsEnabled =
    instance.job_id !== undefined && instance.application_specification !== undefined;

  const { data, isLoading, isError, error } = useGetJob(
    // Since the query will be disabled if job_id is undefined, providing -1 is fine
    instance.job_id ?? -1,
    undefined,
    { query: { enabled: inputsEnabled, retry: instance.job_id === TEST_JOB_ID ? 1 : 3 } },
  );

  // Parse application specification
  const applicationSpecification: ApplicationSpecification = instance.application_specification
    ? JSON.parse(instance.application_specification)
    : { variables: {} };

  // Get information about inputs that were provided when creating the job with their respective
  // values
  const usedInputs = suppliedRunInputs(
    readRunDefinitionVariables(data?.variables).inputs,
    applicationSpecification.variables,
  );

  return { inputs: usedInputs, isLoading, isError, error };
};
